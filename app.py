import os, json, secrets, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_cors import CORS
from models import db, User, Post, Trip, TripLocation, Like, Save, Comment

app = Flask(__name__, static_folder='static', static_url_path='', template_folder='templates')

# ── Config ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///pintrip.db')
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

app.config.update(
    SQLALCHEMY_DATABASE_URI=DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'pintrip-dev-secret-change-in-prod'),
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=24),
    JWT_REFRESH_TOKEN_EXPIRES=timedelta(days=30),
)

db.init_app(app)
jwt = JWTManager(app)
CORS(app, resources={r'/api/*': {'origins': '*'}})

# ── CORS preflight ───────────────────────────────────────────────────────────
@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        r = app.make_response('')
        r.headers['Access-Control-Allow-Origin']  = '*'
        r.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
        r.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        r.status_code = 200
        return r

@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin']  = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    return response

# ── Helpers ───────────────────────────────────────────────────────────────────
def current_uid():
    try:
        return int(get_jwt_identity())
    except Exception:
        return None

def require_gdpr(f):
    """Decorator: reject if user hasn't given GDPR consent."""
    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        u = User.query.get(current_uid())
        if not u or not u.gdpr_consent_at:
            return jsonify(error='GDPR consent required'), 403
        return f(*args, **kwargs)
    return wrapper

# ── Init DB (lazy — runs on first request, not at import time) ────────────────
_db_ready = False

def _migrate():
    """Add any missing columns to existing tables (idempotent)."""
    migrations = [
        ("posts", "title",          "VARCHAR(300)"),
        ("posts", "weather",        "VARCHAR(100)"),
        ("posts", "duration_hours", "FLOAT"),
        ("posts", "cost_nok",       "INTEGER"),
        ("posts",  "media_urls",          "TEXT"),
        ("users",  "reset_token",         "VARCHAR(100)"),
        ("users",  "reset_token_expires", "TIMESTAMP"),
    ]
    with db.engine.connect() as conn:
        for table, col, coltype in migrations:
            try:
                conn.execute(db.text(f"ALTER TABLE {table} ADD COLUMN {col} {coltype}"))
                conn.commit()
                print(f"[migrate] Added column {table}.{col}")
            except Exception:
                pass  # column already exists


@app.before_request
def ensure_db():
    global _db_ready
    if not _db_ready:
        try:
            db.create_all()
            _migrate()
            _db_ready = True
            print("[DB] Tables created OK")
        except Exception as e:
            print(f"[DB] create_all error: {e}")


@app.route('/api/admin/get-reset-token', methods=['POST'])
def admin_get_reset_token():
    d = request.get_json() or {}
    if d.get('key') != os.environ.get('SEED_KEY', 'pintrip-seed-2024'):
        return jsonify(error='Unauthorized'), 403
    email = (d.get('email') or '').strip().lower()
    with db.engine.connect() as conn:
        row = conn.execute(
            db.text("SELECT reset_token, reset_token_expires FROM users WHERE email = :e"),
            {"e": email}
        ).fetchone()
    if not row or not row[0]:
        return jsonify(error='No token found'), 404
    return jsonify(
        token=row[0],
        expires=str(row[1]),
        url=f"https://app.pintrip.no/reset-password?token={row[0]}"
    )


@app.route('/api/admin/migrate', methods=['POST'])
def force_migrate():
    key = (request.get_json() or {}).get('key')
    if key != os.environ.get('SEED_KEY', 'pintrip-seed-2024'):
        return jsonify(error='Unauthorized'), 403
    results = []
    cols = [
        ("users",  "reset_token",         "VARCHAR(100)"),
        ("users",  "reset_token_expires", "TIMESTAMP"),
        ("posts",  "title",               "VARCHAR(300)"),
        ("posts",  "weather",             "VARCHAR(100)"),
        ("posts",  "duration_hours",      "FLOAT"),
        ("posts",  "cost_nok",            "INTEGER"),
        ("posts",  "media_urls",          "TEXT"),
    ]
    with db.engine.connect() as conn:
        for table, col, coltype in cols:
            try:
                conn.execute(db.text(f"ALTER TABLE {table} ADD COLUMN {col} {coltype}"))
                conn.commit()
                results.append(f"ADDED {table}.{col}")
            except Exception as e:
                conn.rollback()
                results.append(f"SKIP {table}.{col}: {str(e)[:60]}")
    return jsonify(ok=True, results=results)

# ── Health ────────────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify(ok=True, status='healthy')


@app.route('/api/config')
def config():
    return jsonify(mapbox_token=os.environ.get('VITE_MAPBOX_TOKEN', ''))

# ── Global error handler (shows real error in JSON) ───────────────────────────
import traceback

@app.errorhandler(500)
def internal_error(e):
    tb = traceback.format_exc()
    print(f"[500] {tb}", flush=True)
    return jsonify(error=str(e), traceback=tb), 500

# ════════════════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    d = request.get_json() or {}
    email    = (d.get('email') or '').strip().lower()
    username = (d.get('username') or '').strip().lower()
    password = d.get('password') or ''
    gdpr     = d.get('gdpr_consent', False)

    if not email or not username or not password:
        return jsonify(error='email, username, and password required'), 400
    if len(password) < 8:
        return jsonify(error='Password must be at least 8 characters'), 400
    if not gdpr:
        return jsonify(error='GDPR consent required to create an account'), 400
    if User.query.filter_by(email=email).first():
        return jsonify(error='Email already registered'), 409
    if User.query.filter_by(username=username).first():
        return jsonify(error='Username taken'), 409

    u = User(
        email=email, username=username, name=d.get('name', username),
        gdpr_consent_at=datetime.now(timezone.utc),
        marketing_consent=bool(d.get('marketing_consent', False))
    )
    u.set_password(password)
    db.session.add(u)
    db.session.commit()

    return jsonify(
        user=u.to_dict(),
        access_token=create_access_token(identity=str(u.id)),
        refresh_token=create_refresh_token(identity=str(u.id)),
    ), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.get_json() or {}
    email    = (d.get('email') or '').strip().lower()
    password = d.get('password') or ''
    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(password):
        return jsonify(error='Invalid credentials'), 401
    return jsonify(
        user=u.to_dict(),
        access_token=create_access_token(identity=str(u.id)),
        refresh_token=create_refresh_token(identity=str(u.id)),
    )


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    try:
        email = ((request.get_json() or {}).get('email') or '').strip().lower()
        # Use raw SQL to avoid SQLAlchemy session state issues
        with db.engine.connect() as conn:
            row = conn.execute(
                db.text("SELECT id, username, name FROM users WHERE email = :e"),
                {"e": email}
            ).fetchone()
        if row:
            uid, uname, uname_display = row[0], row[1], row[2]
            token   = secrets.token_urlsafe(32)
            expires = datetime.utcnow() + timedelta(hours=1)
            try:
                with db.engine.connect() as conn:
                    conn.execute(
                        db.text("UPDATE users SET reset_token = :t, reset_token_expires = :e WHERE id = :id"),
                        {"t": token, "e": expires, "id": uid}
                    )
                    conn.commit()
            except Exception as e:
                print(f"[forgot-password] db error: {e}")
                return jsonify(ok=True)

            display_name = uname_display or uname
            reset_url = f"https://app.pintrip.no/reset-password?token={token}"
            html = (
                '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;'
                'padding:32px;background:#080812;color:#F5F5F0;border-radius:16px">'
                '<div style="text-align:center;margin-bottom:24px">'
                '<h1 style="color:#F5F5F0;font-size:24px;margin:8px 0 4px">PinTrip</h1>'
                '<p style="color:#888;font-size:13px;margin:0">Reset your password</p>'
                '</div>'
                f'<p style="color:#ccc;font-size:14px">Hi {display_name},</p>'
                '<p style="color:#ccc;font-size:14px">We received a request to reset your password. '
                'Click the button below - the link expires in 1 hour.</p>'
                '<div style="text-align:center;margin:28px 0">'
                f'<a href="{reset_url}" style="background:#F5A623;color:#080812;font-weight:700;'
                'font-size:14px;padding:14px 32px;border-radius:999px;text-decoration:none;display:inline-block">'
                'Reset password</a></div>'
                '<p style="color:#666;font-size:12px;text-align:center">'
                "If you didn't request this, you can safely ignore this email.</p>"
                '</div>'
            )
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Reset your PinTrip password'
            msg['From']    = 'PinTrip <heidimybot@gmail.com>'
            msg['To']      = email
            msg.attach(MIMEText(html, 'html', 'utf-8'))
            # Send via Resend API (HTTPS — works on Railway)
            resend_key = os.environ.get('RESEND_API_KEY', '')
            if resend_key:
                try:
                    import urllib.request as _urlreq
                    _payload = json.dumps({
                        "from": "PinTrip <noreply@pintrip.no>",
                        "to": [email],
                        "subject": "Reset your PinTrip password",
                        "html": html
                    }).encode('utf-8')
                    _req = _urlreq.Request(
                        "https://api.resend.com/emails",
                        data=_payload,
                        headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                        method="POST"
                    )
                    with _urlreq.urlopen(_req, timeout=10) as _resp:
                        print(f"[forgot-password] resend OK status={_resp.status} to {email}")
                except Exception as e:
                    print(f"[forgot-password] resend error: {e}")
            else:
                print(f"[forgot-password] no RESEND_API_KEY — email not sent. token saved to DB.")

        return jsonify(ok=True)
    except Exception as e:
        import traceback
        print(f"[forgot-password] unhandled: {traceback.format_exc()}")
        return jsonify(ok=True)


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    d        = request.get_json() or {}
    token    = (d.get('token') or '').strip()
    password = d.get('password') or ''
    if not token or len(password) < 8:
        return jsonify(error='Token and password (min 8 chars) required'), 400

    u = User.query.filter_by(reset_token=token).first()
    if not u:
        return jsonify(error='Invalid or expired reset link'), 400
    if u.reset_token_expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return jsonify(error='Reset link has expired'), 400

    u.set_password(password)
    u.reset_token         = None
    u.reset_token_expires = None
    db.session.commit()
    return jsonify(ok=True)


@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    uid = get_jwt_identity()
    return jsonify(access_token=create_access_token(identity=uid))


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    u = User.query.get(current_uid())
    if not u:
        return jsonify(error='User not found'), 404
    return jsonify(user=u.to_dict())


# ════════════════════════════════════════════════════════════════════════════
# FEED
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/feed', methods=['GET'])
def feed():
    uid      = None
    auth     = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        from flask_jwt_extended import decode_token
        try:
            data = decode_token(auth[7:])
            uid = int(data['sub'])
        except Exception:
            pass

    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    category = request.args.get('category')

    q = Post.query.order_by(Post.created_at.desc())
    if category and category != 'all':
        q = q.filter_by(category=category)

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        posts=[p.to_dict(uid) for p in pagination.items],
        page=page,
        pages=pagination.pages,
        total=pagination.total,
        has_next=pagination.has_next,
    )


# ════════════════════════════════════════════════════════════════════════════
# POSTS
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_media():
    """Accept a media file, save to static/uploads/, return URL."""
    import uuid, os
    if 'file' not in request.files:
        return jsonify(error='No file provided'), 400
    f = request.files['file']
    if not f.filename:
        return jsonify(error='Empty filename'), 400
    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov'}:
        return jsonify(error='Unsupported file type'), 400
    upload_dir = os.path.join(app.static_folder, 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    filename = f'{uuid.uuid4().hex}{ext}'
    f.save(os.path.join(upload_dir, filename))
    url = f'/static/uploads/{filename}'
    return jsonify(url=url), 201


@app.route('/api/posts', methods=['POST'])
@require_gdpr
def create_post():
    import json as _json
    uid = current_uid()
    d   = request.get_json() or {}

    media_urls = d.get('media_urls', [])  # list of URLs
    image_url  = d.get('image_url') or (media_urls[0] if media_urls else None)

    if not image_url:
        return jsonify(error='At least one media item required'), 400
    if not d.get('location_name'):
        return jsonify(error='location_name required'), 400

    extra_media = media_urls[1:] if len(media_urls) > 1 else []

    p = Post(
        user_id=uid,
        image_url=image_url,
        video_url=d.get('video_url'),
        caption=d.get('caption'),
        location_name=d['location_name'],
        city=d.get('city'),
        country=d.get('country'),
        lat=d['lat'],
        lng=d['lng'],
        category=d.get('category', 'city'),
        price_level=d.get('price_level'),
        rating=d.get('rating'),
        affiliate_url=d.get('affiliate_url'),
        title=d.get('title'),
        weather=d.get('weather'),
        duration_hours=d.get('duration_hours'),
        cost_nok=d.get('cost_nok'),
        media_urls=_json.dumps(extra_media) if extra_media else None,
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(post=p.to_dict(uid)), 201


@app.route('/api/posts/<int:pid>', methods=['GET'])
def get_post(pid):
    uid = None
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        from flask_jwt_extended import decode_token
        try:
            data = decode_token(auth[7:])
            uid = int(data['sub'])
        except Exception:
            pass
    p = Post.query.get_or_404(pid)
    return jsonify(post=p.to_dict(uid))


@app.route('/api/posts/<int:pid>', methods=['DELETE'])
@jwt_required()
def delete_post(pid):
    uid = current_uid()
    p   = Post.query.filter_by(id=pid, user_id=uid).first_or_404()
    db.session.delete(p)
    db.session.commit()
    return jsonify(ok=True)


@app.route('/api/posts/<int:pid>', methods=['PATCH'])
@jwt_required()
def edit_post(pid):
    uid = current_uid()
    p   = Post.query.filter_by(id=pid, user_id=uid).first_or_404()
    d   = request.get_json() or {}
    for field in ('caption', 'location_name', 'city', 'country', 'category',
                  'price_level', 'rating', 'affiliate_url', 'title',
                  'weather', 'duration_hours', 'cost_nok'):
        if field in d:
            setattr(p, field, d[field])
    db.session.commit()
    return jsonify(post=p.to_dict(uid))


@app.route('/api/posts/<int:pid>/like', methods=['POST', 'DELETE'])
@jwt_required()
def toggle_like(pid):
    uid = current_uid()
    p   = Post.query.get_or_404(pid)
    existing = Like.query.filter_by(user_id=uid, post_id=pid).first()

    if request.method == 'POST':
        if not existing:
            db.session.add(Like(user_id=uid, post_id=pid))
            db.session.commit()
        return jsonify(liked=True,  like_count=p.likes.count())
    else:
        if existing:
            db.session.delete(existing)
            db.session.commit()
        return jsonify(liked=False, like_count=p.likes.count())


def _add_to_trip(uid, pid, trip_id, post):
    """Add post as TripLocation if not already there; set cover image if first stop."""
    t = Trip.query.filter_by(id=trip_id, user_id=uid).first()
    if not t:
        return
    if TripLocation.query.filter_by(trip_id=trip_id, post_id=pid).first():
        return
    max_order = db.session.query(db.func.max(TripLocation.order_index)).filter_by(trip_id=trip_id).scalar() or -1
    db.session.add(TripLocation(trip_id=trip_id, post_id=pid, order_index=max_order + 1))
    if not t.cover_image_url:
        t.cover_image_url = post.image_url
    t.updated_at = datetime.now(timezone.utc)


@app.route('/api/posts/<int:pid>/save', methods=['POST', 'DELETE'])
@jwt_required()
def toggle_save(pid):
    uid  = current_uid()
    p    = Post.query.get_or_404(pid)
    trip_id = request.get_json(silent=True, force=True).get('trip_id') if request.data else None
    existing = Save.query.filter_by(user_id=uid, post_id=pid).first()

    if request.method == 'POST':
        if existing:
            if trip_id:
                existing.trip_id = trip_id
                _add_to_trip(uid, pid, trip_id, p)
                db.session.commit()
            return jsonify(saved=True, save_count=p.saves.count())
        s = Save(user_id=uid, post_id=pid, trip_id=trip_id)
        db.session.add(s)
        if trip_id:
            _add_to_trip(uid, pid, trip_id, p)
        db.session.commit()
        return jsonify(saved=True, save_count=p.saves.count())
    else:
        if existing:
            db.session.delete(existing)
            db.session.commit()
        return jsonify(saved=False, save_count=p.saves.count())


@app.route('/api/posts/<int:pid>/comments', methods=['GET', 'POST'])
def post_comments(pid):
    Post.query.get_or_404(pid)
    if request.method == 'GET':
        page = int(request.args.get('page', 1))
        items = Comment.query.filter_by(post_id=pid).order_by(Comment.created_at.asc()).paginate(page=page, per_page=20, error_out=False)
        return jsonify(comments=[c.to_dict() for c in items.items], has_next=items.has_next)

    # POST — requires auth
    from flask_jwt_extended import verify_jwt_in_request
    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify(error='Authentication required'), 401
    uid  = current_uid()
    body = (request.get_json() or {}).get('body', '').strip()
    if not body:
        return jsonify(error='Comment body required'), 400
    c = Comment(user_id=uid, post_id=pid, body=body)
    db.session.add(c)
    db.session.commit()
    return jsonify(comment=c.to_dict()), 201


# ════════════════════════════════════════════════════════════════════════════
# TRIPS
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/trips', methods=['GET'])
@jwt_required()
def list_trips():
    uid   = current_uid()
    trips = Trip.query.filter_by(user_id=uid).order_by(Trip.updated_at.desc()).all()
    return jsonify(trips=[t.to_dict() for t in trips])


@app.route('/api/trips', methods=['POST'])
@jwt_required()
def create_trip():
    uid = current_uid()
    d   = request.get_json() or {}
    name = (d.get('name') or '').strip()
    if not name:
        return jsonify(error='Trip name required'), 400

    t = Trip(user_id=uid, name=name, description=d.get('description'))

    # Auto-build from unsaved saves
    if d.get('from_saves'):
        unsorted = Save.query.filter_by(user_id=uid, trip_id=None).all()
        post_ids = [s.post_id for s in unsorted]
        # Sort by longitude (west→east) as a simple geographic order
        posts = Post.query.filter(Post.id.in_(post_ids)).all()
        posts_sorted = sorted(posts, key=lambda p: (p.lng or 0))
        db.session.add(t)
        db.session.flush()  # get t.id
        for i, p in enumerate(posts_sorted):
            db.session.add(TripLocation(trip_id=t.id, post_id=p.id, order_index=i))
            # Update save to point to this trip
            s = Save.query.filter_by(user_id=uid, post_id=p.id).first()
            if s:
                s.trip_id = t.id
        if posts_sorted:
            t.cover_image_url = posts_sorted[0].image_url
    else:
        db.session.add(t)

    db.session.commit()
    return jsonify(trip=t.to_dict(include_locations=True)), 201


@app.route('/api/trips/<int:tid>', methods=['GET'])
@jwt_required()
def get_trip(tid):
    uid = current_uid()
    t   = Trip.query.filter_by(id=tid, user_id=uid).first_or_404()
    return jsonify(trip=t.to_dict(include_locations=True))


@app.route('/api/trips/<int:tid>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_trip(tid):
    uid = current_uid()
    t   = Trip.query.filter_by(id=tid, user_id=uid).first_or_404()
    d   = request.get_json() or {}
    if 'name' in d:        t.name        = d['name']
    if 'description' in d: t.description = d['description']
    if 'is_public' in d:   t.is_public   = bool(d['is_public'])
    t.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(trip=t.to_dict())


@app.route('/api/trips/<int:tid>', methods=['DELETE'])
@jwt_required()
def delete_trip(tid):
    uid = current_uid()
    t   = Trip.query.filter_by(id=tid, user_id=uid).first_or_404()
    db.session.delete(t)
    db.session.commit()
    return jsonify(ok=True)


@app.route('/api/trips/<int:tid>/locations', methods=['POST'])
@jwt_required()
def add_location(tid):
    uid     = current_uid()
    t       = Trip.query.filter_by(id=tid, user_id=uid).first_or_404()
    d       = request.get_json() or {}
    post_id = d.get('post_id')
    if not post_id:
        return jsonify(error='post_id required'), 400
    Post.query.get_or_404(post_id)
    existing = TripLocation.query.filter_by(trip_id=tid, post_id=post_id).first()
    if existing:
        return jsonify(error='Already in this trip'), 409

    max_order = db.session.query(db.func.max(TripLocation.order_index)).filter_by(trip_id=tid).scalar() or -1
    loc = TripLocation(trip_id=tid, post_id=post_id, order_index=max_order + 1, note=d.get('note'))
    db.session.add(loc)

    # Update save to point to this trip
    s = Save.query.filter_by(user_id=uid, post_id=post_id).first()
    if s:
        s.trip_id = tid

    # Set cover image if first location
    if t.locations.count() == 0:
        p = Post.query.get(post_id)
        if p:
            t.cover_image_url = p.image_url

    t.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(location=loc.to_dict()), 201


@app.route('/api/trips/<int:tid>/locations/<int:lid>', methods=['DELETE'])
@jwt_required()
def remove_location(tid, lid):
    uid = current_uid()
    Trip.query.filter_by(id=tid, user_id=uid).first_or_404()
    loc = TripLocation.query.filter_by(id=lid, trip_id=tid).first_or_404()
    db.session.delete(loc)
    db.session.commit()
    return jsonify(ok=True)


@app.route('/api/trips/<int:tid>/locations/reorder', methods=['PUT'])
@jwt_required()
def reorder_locations(tid):
    uid   = current_uid()
    Trip.query.filter_by(id=tid, user_id=uid).first_or_404()
    order = request.get_json().get('order', [])  # list of TripLocation ids
    for idx, loc_id in enumerate(order):
        TripLocation.query.filter_by(id=loc_id, trip_id=tid).update({'order_index': idx})
    db.session.commit()
    return jsonify(ok=True)


# ════════════════════════════════════════════════════════════════════════════
# SEARCH
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/search', methods=['GET'])
def search():
    uid  = None
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        from flask_jwt_extended import decode_token
        try:
            data = decode_token(auth[7:])
            uid = int(data['sub'])
        except Exception:
            pass

    q        = (request.args.get('q') or '').strip()
    category = request.args.get('category')
    page     = int(request.args.get('page', 1))

    query = Post.query
    if q:
        like = f'%{q}%'
        query = query.filter(
            db.or_(
                Post.location_name.ilike(like),
                Post.city.ilike(like),
                Post.country.ilike(like),
                Post.caption.ilike(like),
            )
        )
    if category and category != 'all':
        query = query.filter_by(category=category)

    pagination = query.order_by(Post.created_at.desc()).paginate(page=page, per_page=20, error_out=False)
    return jsonify(
        posts=[p.to_dict(uid) for p in pagination.items],
        total=pagination.total,
        has_next=pagination.has_next,
    )


# ════════════════════════════════════════════════════════════════════════════
# PROFILE
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/profile/<username>', methods=['GET'])
def profile(username):
    uid  = None
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        from flask_jwt_extended import decode_token
        try:
            data = decode_token(auth[7:])
            uid = int(data['sub'])
        except Exception:
            pass

    u = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(user_id=u.id).order_by(Post.created_at.desc()).limit(30).all()
    return jsonify(user=u.to_dict(), posts=[p.to_dict(uid) for p in posts])


@app.route('/api/profile/me', methods=['PATCH'])
@jwt_required()
def update_profile():
    uid = current_uid()
    u   = User.query.get_or_404(uid)
    d   = request.get_json() or {}
    for field in ('name', 'bio', 'avatar_url'):
        if field in d:
            setattr(u, field, d[field])
    db.session.commit()
    return jsonify(user=u.to_dict())


@app.route('/api/profile/me/saves', methods=['GET'])
@jwt_required()
def my_saves():
    uid  = current_uid()
    saves = Save.query.filter_by(user_id=uid, trip_id=None).all()
    post_ids = [s.post_id for s in saves]
    posts = Post.query.filter(Post.id.in_(post_ids)).all()
    return jsonify(posts=[p.to_dict(uid) for p in posts])


# ════════════════════════════════════════════════════════════════════════════
# GDPR
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/gdpr/consent', methods=['POST'])
@jwt_required()
def gdpr_consent():
    uid = current_uid()
    u   = User.query.get_or_404(uid)
    d   = request.get_json() or {}
    u.gdpr_consent_at   = datetime.now(timezone.utc)
    u.marketing_consent = bool(d.get('marketing', False))
    db.session.commit()
    return jsonify(ok=True, consented_at=u.gdpr_consent_at.isoformat())


@app.route('/api/gdpr/export', methods=['GET'])
@jwt_required()
def gdpr_export():
    uid = current_uid()
    u   = User.query.get_or_404(uid)
    posts    = [p.to_dict() for p in u.posts.all()]
    trips    = [t.to_dict(include_locations=True) for t in u.trips.all()]
    likes    = [{'post_id': l.post_id, 'created_at': l.created_at.isoformat()} for l in u.likes.all()]
    saves    = [{'post_id': s.post_id, 'trip_id': s.trip_id, 'created_at': s.created_at.isoformat()} for s in u.saves.all()]
    comments = [{'post_id': c.post_id, 'body': c.body, 'created_at': c.created_at.isoformat()} for c in u.comments.all()]
    data = {
        'exported_at': datetime.now(timezone.utc).isoformat(),
        'user': {
            'id': u.id, 'email': u.email, 'username': u.username,
            'name': u.name, 'bio': u.bio,
            'gdpr_consent_at': u.gdpr_consent_at.isoformat() if u.gdpr_consent_at else None,
            'marketing_consent': u.marketing_consent,
            'created_at': u.created_at.isoformat(),
        },
        'posts': posts, 'trips': trips,
        'likes': likes, 'saves': saves, 'comments': comments,
    }
    from flask import Response
    return Response(
        json.dumps(data, indent=2, ensure_ascii=False),
        mimetype='application/json',
        headers={'Content-Disposition': f'attachment; filename="pintrip-data-{uid}.json"'}
    )


@app.route('/api/gdpr/delete', methods=['DELETE'])
@jwt_required()
def gdpr_delete():
    uid = current_uid()
    u   = User.query.get_or_404(uid)
    db.session.delete(u)
    db.session.commit()
    return jsonify(ok=True, message='Your account and all associated data have been permanently deleted.')


# ════════════════════════════════════════════════════════════════════════════
# SEED (dev only)
# ════════════════════════════════════════════════════════════════════════════

@app.route('/api/seed', methods=['POST'])
def seed():
    seed_key = os.environ.get('SEED_KEY', '')
    provided  = (request.get_json(silent=True) or {}).get('key', '')
    if os.environ.get('RAILWAY_ENVIRONMENT') == 'production':
        if not seed_key or provided != seed_key:
            return jsonify(error='Not available in production'), 403
    from seed import run_seed
    run_seed(db, app)
    return jsonify(ok=True, message='Database seeded')


# ════════════════════════════════════════════════════════════════════════════
# SPA CATCH-ALL
# ════════════════════════════════════════════════════════════════════════════

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def spa(path):
    if path.startswith('api/') or path.startswith('static/'):
        from flask import abort
        abort(404)
    return render_template('index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', '0') == '1')
