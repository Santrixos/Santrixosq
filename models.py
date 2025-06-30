from app import db
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    playlists = db.relationship('Playlist', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    history = db.relationship('PlayHistory', backref='user', lazy=True, cascade='all, delete-orphan')

class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)
    
    # Relationships
    tracks = db.relationship('PlaylistTrack', backref='playlist', lazy=True, cascade='all, delete-orphan')

class PlaylistTrack(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlist.id'), nullable=False)
    youtube_id = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200))
    duration = db.Column(db.String(20))
    thumbnail = db.Column(db.String(500))
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    position = db.Column(db.Integer, default=0)

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    youtube_id = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200))
    thumbnail = db.Column(db.String(500))
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

class PlayHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    youtube_id = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200))
    thumbnail = db.Column(db.String(500))
    played_at = db.Column(db.DateTime, default=datetime.utcnow)
