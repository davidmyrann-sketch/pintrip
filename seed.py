"""Seed the database with beautiful travel content (placeholder Unsplash images)."""

def run_seed(db, app):
    from models import User, Post, Trip, TripLocation

    with app.app_context():
        # Create demo user
        u = User.query.filter_by(email='demo@pintrip.app').first()
        if not u:
            from datetime import datetime, timezone
            u = User(
                email='demo@pintrip.app',
                username='pintrip',
                name='PinTrip Demo',
                avatar_url='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
                bio='Discover the world, one pin at a time.',
                gdpr_consent_at=datetime.now(timezone.utc),
            )
            u.set_password('demo1234')
            db.session.add(u)
            db.session.flush()

        POSTS = [
            {
                'image_url': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=85&fit=crop',
                'caption': 'The Amalfi Coast — where every road is a postcard waiting to happen.',
                'location_name': 'Amalfi Coast', 'city': 'Amalfi', 'country': 'Italy',
                'lat': 40.634, 'lng': 14.603, 'category': 'nature', 'price_level': 3, 'rating': 4.9,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=85&fit=crop',
                'caption': 'Blue domes and white walls. Santorini at golden hour is unreal.',
                'location_name': 'Oia Sunset Point', 'city': 'Santorini', 'country': 'Greece',
                'lat': 36.461, 'lng': 25.375, 'category': 'beach', 'price_level': 3, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=85&fit=crop',
                'caption': 'Tokyo at night hits different. Neon, ramen, and zero sleep.',
                'location_name': 'Shinjuku', 'city': 'Tokyo', 'country': 'Japan',
                'lat': 35.690, 'lng': 139.700, 'category': 'city', 'price_level': 2, 'rating': 4.9,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=85&fit=crop',
                'caption': 'Rice terraces carved into the hillside over 2,000 years ago. Bali magic.',
                'location_name': 'Tegalalang Rice Terrace', 'city': 'Ubud', 'country': 'Indonesia',
                'lat': -8.432, 'lng': 115.279, 'category': 'nature', 'price_level': 1, 'rating': 4.7,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=85&fit=crop',
                'caption': 'Paris never gets old. Eiffel Tower from Trocadéro at dusk.',
                'location_name': 'Trocadéro', 'city': 'Paris', 'country': 'France',
                'lat': 48.862, 'lng': 2.289, 'category': 'city', 'price_level': 3, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=85&fit=crop',
                'caption': 'Overwater bungalow in the Maldives. This is what peace looks like.',
                'location_name': 'Rangali Island', 'city': 'South Ari Atoll', 'country': 'Maldives',
                'lat': 3.658, 'lng': 72.714, 'category': 'beach', 'price_level': 4, 'rating': 5.0,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=85&fit=crop',
                'caption': 'NYC from above. The city that never stops.',
                'location_name': 'Manhattan', 'city': 'New York', 'country': 'USA',
                'lat': 40.758, 'lng': -73.985, 'category': 'city', 'price_level': 3, 'rating': 4.6,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=85&fit=crop',
                'caption': 'Fushimi Inari — thousands of torii gates winding up the mountain.',
                'location_name': 'Fushimi Inari Shrine', 'city': 'Kyoto', 'country': 'Japan',
                'lat': 34.967, 'lng': 135.773, 'category': 'culture', 'price_level': 1, 'rating': 4.9,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1555990793-da11153b4559?w=800&q=85&fit=crop',
                'caption': 'Dubrovnik — Game of Thrones vibes and the most electric city walls in Europe.',
                'location_name': 'Old City Walls', 'city': 'Dubrovnik', 'country': 'Croatia',
                'lat': 42.641, 'lng': 18.111, 'category': 'culture', 'price_level': 2, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=85&fit=crop',
                'caption': 'Sagrada Família — Gaudí\'s masterpiece. Still unfinished after 140 years.',
                'location_name': 'Sagrada Família', 'city': 'Barcelona', 'country': 'Spain',
                'lat': 41.404, 'lng': 2.174, 'category': 'culture', 'price_level': 2, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800&q=85&fit=crop',
                'caption': 'Aurora Borealis over Iceland. Nothing prepares you for this.',
                'location_name': 'Kirkjufell Mountain', 'city': 'Grundarfjörður', 'country': 'Iceland',
                'lat': 64.940, 'lng': -23.302, 'category': 'adventure', 'price_level': 3, 'rating': 5.0,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1601928576823-ab09ce32c11a?w=800&q=85&fit=crop',
                'caption': 'Positano cascading into the sea. La dolce vita in every frame.',
                'location_name': 'Positano', 'city': 'Positano', 'country': 'Italy',
                'lat': 40.628, 'lng': 14.485, 'category': 'beach', 'price_level': 3, 'rating': 4.9,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1597211073491-5b3c1e7af36e?w=800&q=85&fit=crop',
                'caption': 'Marrakech souks. Colors, spices, and getting blissfully lost.',
                'location_name': 'Djemaa el-Fna', 'city': 'Marrakech', 'country': 'Morocco',
                'lat': 31.625, 'lng': -7.989, 'category': 'culture', 'price_level': 1, 'rating': 4.6,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=85&fit=crop',
                'caption': 'Rio de Janeiro from the top. Christ the Redeemer in clouds.',
                'location_name': 'Cristo Redentor', 'city': 'Rio de Janeiro', 'country': 'Brazil',
                'lat': -22.952, 'lng': -43.210, 'category': 'city', 'price_level': 2, 'rating': 4.7,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=85&fit=crop',
                'caption': 'Cape Town and Table Mountain. One of the most beautiful cities on Earth.',
                'location_name': 'Table Mountain', 'city': 'Cape Town', 'country': 'South Africa',
                'lat': -33.963, 'lng': 18.404, 'category': 'adventure', 'price_level': 2, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85&fit=crop',
                'caption': 'Swiss Alps. Woke up to this at 3,000m. Worth every step.',
                'location_name': 'Lauterbrunnen Valley', 'city': 'Lauterbrunnen', 'country': 'Switzerland',
                'lat': 46.593, 'lng': 7.908, 'category': 'adventure', 'price_level': 4, 'rating': 4.9,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop',
                'caption': 'The Colosseum. 2,000 years of history right in front of you.',
                'location_name': 'Colosseum', 'city': 'Rome', 'country': 'Italy',
                'lat': 41.890, 'lng': 12.492, 'category': 'culture', 'price_level': 2, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=85&fit=crop',
                'caption': 'Navagio Beach. A shipwreck, turquoise water, and no words needed.',
                'location_name': 'Navagio Beach', 'city': 'Zakynthos', 'country': 'Greece',
                'lat': 37.862, 'lng': 20.625, 'category': 'beach', 'price_level': 2, 'rating': 4.9,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1603203040743-24aced6793b4?w=800&q=85&fit=crop',
                'caption': 'Ha Long Bay by sunrise. 1,600 limestone islands rising from the mist.',
                'location_name': 'Ha Long Bay', 'city': 'Quảng Ninh', 'country': 'Vietnam',
                'lat': 20.910, 'lng': 107.184, 'category': 'nature', 'price_level': 2, 'rating': 4.8,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=85&fit=crop',
                'caption': 'Petra by night, lit only by candles. Indiana Jones would approve.',
                'location_name': 'The Treasury', 'city': 'Petra', 'country': 'Jordan',
                'lat': 30.329, 'lng': 35.443, 'category': 'culture', 'price_level': 2, 'rating': 4.9,
            },
        ]

        for data in POSTS:
            existing = Post.query.filter_by(
                location_name=data['location_name'], user_id=u.id
            ).first()
            if not existing:
                p = Post(user_id=u.id, **data)
                db.session.add(p)

        db.session.commit()
        print(f'✅ Seed complete — {len(POSTS)} posts loaded.')
