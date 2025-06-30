from flask import render_template, request, redirect, url_for, session, flash, jsonify
from app import app, db
from models import User, Playlist, PlaylistTrack, Favorite, PlayHistory
from youtube_api import youtube_api
import logging

@app.route('/')
def index():
    """Home page with trending music"""
    trending_music = youtube_api.get_trending_music(12)
    return render_template('index.html', trending_music=trending_music)

@app.route('/search')
def search():
    """Search page for music"""
    query = request.args.get('q', '')
    results = []
    
    if query:
        results = youtube_api.search_music(query, 24)
    
    return render_template('search.html', query=query, results=results)

@app.route('/library')
def library():
    """User's music library"""
    # For demo purposes, show some sample data
    # In production, this would fetch user's saved music
    recent_played = []
    favorites = []
    
    return render_template('library.html', recent_played=recent_played, favorites=favorites)

@app.route('/playlists')
def playlists():
    """User's playlists"""
    # For demo purposes, show empty state
    # In production, this would fetch user's playlists
    user_playlists = []
    
    return render_template('playlists.html', playlists=user_playlists)

@app.route('/discover')
def discover():
    """Discover new music"""
    # Get various music categories
    trending = youtube_api.get_trending_music(8)
    
    # Search for different genres
    genres = ['pop', 'rock', 'hip hop', 'electronic', 'jazz', 'classical']
    genre_music = {}
    
    for genre in genres[:3]:  # Limit to 3 genres for performance
        genre_music[genre] = youtube_api.search_music(genre, 6)
    
    return render_template('discover.html', trending=trending, genre_music=genre_music)

@app.route('/profile')
def profile():
    """User profile page"""
    return render_template('profile.html')

@app.route('/player/<video_id>')
def player(video_id):
    """Music/video player page"""
    video_details = youtube_api.get_video_details(video_id)
    
    if not video_details:
        flash("Video not found or unavailable", "error")
        return redirect(url_for('index'))
    
    # Get related music
    related_music = youtube_api.search_music(video_details['artist'], 10)
    
    return render_template('player.html', video=video_details, related_music=related_music)

@app.route('/api/add_to_favorites', methods=['POST'])
def add_to_favorites():
    """Add a track to favorites"""
    try:
        data = request.get_json()
        video_id = data.get('video_id')
        title = data.get('title')
        artist = data.get('artist')
        thumbnail = data.get('thumbnail')
        
        # For demo purposes, just return success
        # In production, this would save to database
        return jsonify({'success': True, 'message': 'Added to favorites'})
        
    except Exception as e:
        logging.error(f"Error adding to favorites: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to add to favorites'})

@app.route('/api/create_playlist', methods=['POST'])
def create_playlist():
    """Create a new playlist"""
    try:
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')
        
        # For demo purposes, just return success
        # In production, this would create playlist in database
        return jsonify({'success': True, 'message': 'Playlist created successfully'})
        
    except Exception as e:
        logging.error(f"Error creating playlist: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create playlist'})

@app.errorhandler(404)
def not_found_error(error):
    return render_template('base.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('base.html'), 500