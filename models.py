from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

def now_utc():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = 'users'
    id          = db.Column(db.Integer, primary_key=True)
    email       = db.Column(db.String(255), unique=True, nullable=False)
    username    = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name        = db.Column(db.String(200))
    avatar_url  = db.Column(db.Text)
    bio         = db.Column(db.Text)
    gdpr_consent_at    = db.Column(db.DateTime, nullable=True)
    marketing_consent  = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=now_utc)
    updated_at  = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    posts    = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    trips    = db.relationship('Trip', backref='owner',  lazy='dynamic', cascade='all, delete-orphan')
    likes    = db.relationship('Like', backref='user',   lazy='dynamic', cascade='all, delete-orphan')
    saves    = db.relationship('Save', backref='user',   lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, p):
        self.password_hash = generate_password_hash(p)

    def check_password(self, p):
        return check_password_hash(self.password_hash, p)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'post_count': self.posts.count(),
            'trip_count': self.trips.count(),
        }


class Post(db.Model):
    __tablename__ = 'posts'
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    image_url     = db.Column(db.Text, nullable=False)
    video_url     = db.Column(db.Text)
    caption       = db.Column(db.Text)
    location_name = db.Column(db.String(300))
    city          = db.Column(db.String(200))
    country       = db.Column(db.String(200))
    lat           = db.Column(db.Float)
    lng           = db.Column(db.Float)
    category      = db.Column(db.String(100))   # beach | city | food | adventure | culture | nature
    price_level   = db.Column(db.Integer)        # 1–4
    rating        = db.Column(db.Float)          # 1.0–5.0
    affiliate_url = db.Column(db.Text)
    created_at    = db.Column(db.DateTime, default=now_utc)

    likes    = db.relationship('Like',    backref='post', lazy='dynamic', cascade='all, delete-orphan')
    saves    = db.relationship('Save',    backref='post', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, uid=None):
        liked = saved = False
        if uid:
            liked = Like.query.filter_by(user_id=uid, post_id=self.id).first() is not None
            saved = Save.query.filter_by(user_id=uid, post_id=self.id).first() is not None
        return {
            'id': self.id,
            'user': self.author.to_dict() if self.author else None,
            'image_url': self.image_url,
            'video_url': self.video_url,
            'caption': self.caption,
            'location_name': self.location_name,
            'city': self.city,
            'country': self.country,
            'lat': self.lat,
            'lng': self.lng,
            'category': self.category,
            'price_level': self.price_level,
            'rating': self.rating,
            'affiliate_url': self.affiliate_url,
            'like_count': self.likes.count(),
            'save_count': self.saves.count(),
            'comment_count': self.comments.count(),
            'liked': liked,
            'saved': saved,
            'created_at': self.created_at.isoformat(),
        }


class Trip(db.Model):
    __tablename__ = 'trips'
    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name            = db.Column(db.String(300), nullable=False)
    description     = db.Column(db.Text)
    cover_image_url = db.Column(db.Text)
    is_public       = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=now_utc)
    updated_at      = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    locations = db.relationship('TripLocation', backref='trip', lazy='dynamic',
                                cascade='all, delete-orphan', order_by='TripLocation.order_index')

    def to_dict(self, include_locations=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'cover_image_url': self.cover_image_url,
            'is_public': self.is_public,
            'location_count': self.locations.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        if include_locations:
            data['locations'] = [loc.to_dict() for loc in self.locations.order_by(TripLocation.order_index)]
        return data


class TripLocation(db.Model):
    __tablename__ = 'trip_locations'
    id          = db.Column(db.Integer, primary_key=True)
    trip_id     = db.Column(db.Integer, db.ForeignKey('trips.id',  ondelete='CASCADE'), nullable=False)
    post_id     = db.Column(db.Integer, db.ForeignKey('posts.id',  ondelete='CASCADE'), nullable=False)
    order_index = db.Column(db.Integer, default=0)
    note        = db.Column(db.Text)
    added_at    = db.Column(db.DateTime, default=now_utc)

    post = db.relationship('Post')

    def to_dict(self):
        return {
            'id': self.id,
            'order_index': self.order_index,
            'note': self.note,
            'post': self.post.to_dict() if self.post else None,
        }


class Like(db.Model):
    __tablename__ = 'likes'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=now_utc)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id'),)


class Save(db.Model):
    __tablename__ = 'saves'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id',  ondelete='CASCADE'),  nullable=False)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id',  ondelete='CASCADE'),  nullable=False)
    trip_id    = db.Column(db.Integer, db.ForeignKey('trips.id',  ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=now_utc)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id'),)


class Comment(db.Model):
    __tablename__ = 'comments'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    body       = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=now_utc)

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.author.to_dict() if self.author else None,
            'body': self.body,
            'created_at': self.created_at.isoformat(),
        }
