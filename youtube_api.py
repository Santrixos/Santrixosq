import os
import requests
import logging

class YouTubeAPI:
    def __init__(self):
        self.api_key = os.getenv("AIzaSyCp-xBgE5lNzCuUQcJZ0-5zDj4TVRJRgH8", "default_youtube_api_key")
        self.base_url = "https://www.googleapis.com/youtube/v3"
        
    def search_music(self, query, max_results=20):
        """Search for music videos on YouTube"""
        try:
            url = f"{self.base_url}/search"
            params = {
                'part': 'snippet',
                'q': f"{query} music",
                'type': 'video',
                'videoCategoryId': '10',  # Music category
                'maxResults': max_results,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            results = []
            for item in data.get('items', []):
                video_info = {
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'artist': item['snippet']['channelTitle'],
                    'thumbnail': item['snippet']['thumbnails']['high']['url'],
                    'published': item['snippet']['publishedAt'],
                    'description': item['snippet']['description'][:200] + '...' if len(item['snippet']['description']) > 200 else item['snippet']['description']
                }
                results.append(video_info)
                
            return results
            
        except Exception as e:
            logging.error(f"YouTube API search error: {str(e)}")
            return []
    
    def get_video_details(self, video_id):
        """Get detailed information about a specific video"""
        try:
            url = f"{self.base_url}/videos"
            params = {
                'part': 'snippet,contentDetails,statistics',
                'id': video_id,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('items'):
                item = data['items'][0]
                return {
                    'id': item['id'],
                    'title': item['snippet']['title'],
                    'artist': item['snippet']['channelTitle'],
                    'duration': item['contentDetails']['duration'],
                    'thumbnail': item['snippet']['thumbnails']['maxres']['url'] if 'maxres' in item['snippet']['thumbnails'] else item['snippet']['thumbnails']['high']['url'],
                    'view_count': item['statistics'].get('viewCount', '0'),
                    'like_count': item['statistics'].get('likeCount', '0'),
                    'description': item['snippet']['description']
                }
            
            return None
            
        except Exception as e:
            logging.error(f"YouTube API video details error: {str(e)}")
            return None
    
    def get_trending_music(self, max_results=20):
        """Get trending music videos"""
        try:
            url = f"{self.base_url}/videos"
            params = {
                'part': 'snippet,statistics',
                'chart': 'mostPopular',
                'videoCategoryId': '10',  # Music category
                'regionCode': 'US',
                'maxResults': max_results,
                'key': self.api_key
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            results = []
            for item in data.get('items', []):
                video_info = {
                    'id': item['id'],
                    'title': item['snippet']['title'],
                    'artist': item['snippet']['channelTitle'],
                    'thumbnail': item['snippet']['thumbnails']['high']['url'],
                    'view_count': item['statistics'].get('viewCount', '0'),
                    'published': item['snippet']['publishedAt']
                }
                results.append(video_info)
                
            return results
            
        except Exception as e:
            logging.error(f"YouTube API trending error: {str(e)}")
            return []

# Global instance
youtube_api = YouTubeAPI()
