from app import create_app
from models import db, Sport

app, _ = create_app('development')

with app.app_context():
    # Check if sports exist
    count = Sport.query.count()
    if count == 0:
        sports = [
            Sport(name='Basketball', icon='🏀'),
            Sport(name='Soccer', icon='⚽'),
            Sport(name='Tennis', icon='🎾'),
            Sport(name='Badminton', icon='🏸'),
            Sport(name='Volleyball', icon='🏐'),
            Sport(name='Baseball', icon='⚾'),
            Sport(name='Football', icon='🏈'),
            Sport(name='Hockey', icon='🏒'),
            Sport(name='Table Tennis', icon='🏓'),
            Sport(name='Cricket', icon='🏏'),
        ]
        for sport in sports:
            db.session.add(sport)
        db.session.commit()
        print(f'✅ Added {len(sports)} sports to database!')
    else:
        print(f'✅ Database already has {count} sports')
