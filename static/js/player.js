// THE STYLE OF MUSIC - Player JavaScript
// Handles dual audio/video player functionality with YouTube integration

class MusicPlayer {
    constructor() {
        this.currentVideoId = null;
        this.currentTitle = null;
        this.currentArtist = null;
        this.currentThumbnail = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 70;
        this.isMuted = false;
        this.isShuffleOn = false;
        this.repeatMode = 'none'; // none, one, all
        this.queue = [];
        this.currentIndex = 0;
        this.playerMode = 'video'; // video or audio
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadYouTubeAPI();
        this.restoreSettings();
    }
    
    bindEvents() {
        // Mini player controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('#miniPlayPauseBtn')) {
                this.togglePlayPause();
            }
            if (e.target.closest('#miniPrevBtn')) {
                this.playPrevious();
            }
            if (e.target.closest('#miniNextBtn')) {
                this.playNext();
            }
            if (e.target.closest('#miniVolumeBtn')) {
                this.toggleMute();
            }
            if (e.target.closest('#miniFullPlayerBtn')) {
                this.openFullPlayer();
            }
        });
        
        // Volume control
        const volumeSlider = document.getElementById('volumeRange');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }
        
        // Progress bar click
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                this.seekTo(e);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seekRelative(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seekRelative(10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.adjustVolume(5);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.adjustVolume(-5);
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
            }
        });
    }
    
    loadYouTubeAPI() {
        if (window.YT) {
            this.onYouTubeIframeAPIReady();
            return;
        }
        
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Set global callback
        window.onYouTubeIframeAPIReady = () => {
            this.onYouTubeIframeAPIReady();
        };
    }
    
    onYouTubeIframeAPIReady() {
        console.log('YouTube API Ready');
        // Initialize YouTube players if on player page
        if (document.getElementById('youtubePlayer')) {
            this.initializeYouTubePlayers();
        }
    }
    
    initializeYouTubePlayers() {
        // Video player
        if (document.getElementById('youtubePlayer')) {
            this.videoPlayer = new YT.Player('youtubePlayer', {
                events: {
                    'onReady': (event) => this.onPlayerReady(event, 'video'),
                    'onStateChange': (event) => this.onPlayerStateChange(event, 'video')
                }
            });
        }
        
        // Audio player
        if (document.getElementById('youtubeAudioPlayer')) {
            this.audioPlayer = new YT.Player('youtubeAudioPlayer', {
                events: {
                    'onReady': (event) => this.onPlayerReady(event, 'audio'),
                    'onStateChange': (event) => this.onPlayerStateChange(event, 'audio')
                }
            });
        }
    }
    
    onPlayerReady(event, type) {
        console.log(`${type} player ready`);
        if (type === 'video') {
            this.videoPlayerReady = true;
        } else {
            this.audioPlayerReady = true;
        }
        
        // Set initial volume
        event.target.setVolume(this.volume);
        
        // Start progress updates
        if (type === this.playerMode) {
            this.startProgressUpdates();
        }
    }
    
    onPlayerStateChange(event, type) {
        const state = event.data;
        
        // Only handle events from the active player
        if (type !== this.playerMode) return;
        
        switch(state) {
            case YT.PlayerState.PLAYING:
                this.isPlaying = true;
                this.updatePlayPauseButton(true);
                this.startProgressUpdates();
                this.startAudioWaves();
                break;
                
            case YT.PlayerState.PAUSED:
                this.isPlaying = false;
                this.updatePlayPauseButton(false);
                this.stopProgressUpdates();
                this.stopAudioWaves();
                break;
                
            case YT.PlayerState.ENDED:
                this.onTrackEnded();
                break;
                
            case YT.PlayerState.BUFFERING:
                console.log('Buffering...');
                break;
        }
    }
    
    playTrack(videoId, title = '', artist = '', thumbnail = '') {
        this.currentVideoId = videoId;
        this.currentTitle = title;
        this.currentArtist = artist;
        this.currentThumbnail = thumbnail;
        
        // Update UI
        this.updateTrackInfo();
        this.updateMiniPlayer();
        this.showMiniPlayer();
        
        // Play on active player
        const activePlayer = this.getActivePlayer();
        if (activePlayer && activePlayer.loadVideoById) {
            activePlayer.loadVideoById(videoId);
        }
        
        // Update queue
        this.addToHistory(videoId, title, artist, thumbnail);
        
        console.log(`Playing: ${title} by ${artist}`);
    }
    
    togglePlayPause() {
        const activePlayer = this.getActivePlayer();
        if (!activePlayer) return;
        
        if (this.isPlaying) {
            activePlayer.pauseVideo();
        } else {
            activePlayer.playVideo();
        }
    }
    
    playPrevious() {
        if (this.queue.length === 0) return;
        
        this.currentIndex = Math.max(0, this.currentIndex - 1);
        const track = this.queue[this.currentIndex];
        if (track) {
            this.playTrack(track.videoId, track.title, track.artist, track.thumbnail);
        }
    }
    
    playNext() {
        if (this.queue.length === 0) return;
        
        if (this.isShuffleOn) {
            this.currentIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.currentIndex = Math.min(this.queue.length - 1, this.currentIndex + 1);
        }
        
        const track = this.queue[this.currentIndex];
        if (track) {
            this.playTrack(track.videoId, track.title, track.artist, track.thumbnail);
        }
    }
    
    onTrackEnded() {
        switch(this.repeatMode) {
            case 'one':
                // Replay current track
                const activePlayer = this.getActivePlayer();
                if (activePlayer) {
                    activePlayer.seekTo(0);
                    activePlayer.playVideo();
                }
                break;
                
            case 'all':
                this.playNext();
                // If we're at the end, start from beginning
                if (this.currentIndex >= this.queue.length - 1) {
                    this.currentIndex = 0;
                    const track = this.queue[this.currentIndex];
                    if (track) {
                        this.playTrack(track.videoId, track.title, track.artist, track.thumbnail);
                    }
                }
                break;
                
            default:
                // Just play next if available
                if (this.currentIndex < this.queue.length - 1) {
                    this.playNext();
                }
                break;
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        
        const activePlayer = this.getActivePlayer();
        if (activePlayer && activePlayer.setVolume) {
            activePlayer.setVolume(this.volume);
        }
        
        // Update volume icon
        this.updateVolumeIcon();
        
        // Save to localStorage
        localStorage.setItem('musicPlayerVolume', this.volume);
    }
    
    adjustVolume(delta) {
        this.setVolume(this.volume + delta);
        
        // Update volume slider if it exists
        const volumeSlider = document.getElementById('volumeRange');
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }
    
    toggleMute() {
        const activePlayer = this.getActivePlayer();
        if (!activePlayer) return;
        
        if (this.isMuted) {
            activePlayer.unMute();
            this.isMuted = false;
        } else {
            activePlayer.mute();
            this.isMuted = true;
        }
        
        this.updateVolumeIcon();
    }
    
    seekTo(event) {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;
        
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = (clickX / rect.width);
        
        const activePlayer = this.getActivePlayer();
        if (activePlayer && activePlayer.getDuration) {
            const duration = activePlayer.getDuration();
            const seekTime = duration * percentage;
            activePlayer.seekTo(seekTime);
        }
    }
    
    seekRelative(seconds) {
        const activePlayer = this.getActivePlayer();
        if (activePlayer && activePlayer.getCurrentTime) {
            const currentTime = activePlayer.getCurrentTime();
            const newTime = Math.max(0, currentTime + seconds);
            activePlayer.seekTo(newTime);
        }
    }
    
    switchPlayerMode(mode) {
        if (mode === this.playerMode) return;
        
        const currentTime = this.getCurrentTime();
        const wasPlaying = this.isPlaying;
        
        // Pause current player
        const currentPlayer = this.getActivePlayer();
        if (currentPlayer) {
            currentPlayer.pauseVideo();
        }
        
        // Switch mode
        this.playerMode = mode;
        
        // Show/hide appropriate player
        const videoPlayer = document.getElementById('videoPlayer');
        const audioPlayer = document.getElementById('audioPlayer');
        
        if (mode === 'video') {
            videoPlayer?.classList.remove('d-none');
            audioPlayer?.classList.add('d-none');
        } else {
            videoPlayer?.classList.add('d-none');
            audioPlayer?.classList.remove('d-none');
        }
        
        // Resume playback on new player
        setTimeout(() => {
            const newPlayer = this.getActivePlayer();
            if (newPlayer && this.currentVideoId) {
                newPlayer.loadVideoById(this.currentVideoId, currentTime);
                if (wasPlaying) {
                    newPlayer.playVideo();
                }
            }
        }, 100);
    }
    
    addToQueue(videoId, title, artist, thumbnail) {
        const track = { videoId, title, artist, thumbnail };
        this.queue.push(track);
        
        // Update queue UI
        this.updateQueueUI();
        
        console.log(`Added to queue: ${title}`);
    }
    
    removeFromQueue(index) {
        if (index >= 0 && index < this.queue.length) {
            this.queue.splice(index, 1);
            
            // Adjust current index if necessary
            if (this.currentIndex > index) {
                this.currentIndex--;
            }
            
            this.updateQueueUI();
        }
    }
    
    clearQueue() {
        this.queue = [];
        this.currentIndex = 0;
        this.updateQueueUI();
    }
    
    shuffleQueue() {
        if (this.queue.length <= 1) return;
        
        // Fisher-Yates shuffle
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        
        this.updateQueueUI();
    }
    
    toggleShuffle() {
        this.isShuffleOn = !this.isShuffleOn;
        
        // Update shuffle button
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffleOn);
        }
        
        // Save to localStorage
        localStorage.setItem('musicPlayerShuffle', this.isShuffleOn);
    }
    
    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        // Update repeat button
        const repeatBtn = document.getElementById('repeatBtn');
        if (repeatBtn) {
            repeatBtn.classList.remove('repeat-none', 'repeat-one', 'repeat-all');
            repeatBtn.classList.add(`repeat-${this.repeatMode}`);
            
            const icon = repeatBtn.querySelector('i');
            if (icon) {
                switch(this.repeatMode) {
                    case 'one':
                        icon.className = 'fas fa-redo';
                        repeatBtn.classList.add('active');
                        break;
                    case 'all':
                        icon.className = 'fas fa-retweet';
                        repeatBtn.classList.add('active');
                        break;
                    default:
                        icon.className = 'fas fa-redo';
                        repeatBtn.classList.remove('active');
                        break;
                }
            }
        }
        
        // Save to localStorage
        localStorage.setItem('musicPlayerRepeat', this.repeatMode);
    }
    
    // Helper methods
    getActivePlayer() {
        if (this.playerMode === 'video' && this.videoPlayer) {
            return this.videoPlayer;
        } else if (this.playerMode === 'audio' && this.audioPlayer) {
            return this.audioPlayer;
        }
        return null;
    }
    
    getCurrentTime() {
        const activePlayer = this.getActivePlayer();
        return activePlayer && activePlayer.getCurrentTime ? activePlayer.getCurrentTime() : 0;
    }
    
    getDuration() {
        const activePlayer = this.getActivePlayer();
        return activePlayer && activePlayer.getDuration ? activePlayer.getDuration() : 0;
    }
    
    startProgressUpdates() {
        this.stopProgressUpdates();
        
        this.progressInterval = setInterval(() => {
            const activePlayer = this.getActivePlayer();
            if (activePlayer && activePlayer.getCurrentTime && activePlayer.getDuration) {
                this.currentTime = activePlayer.getCurrentTime();
                this.duration = activePlayer.getDuration();
                
                this.updateProgressBar();
                this.updateTimeDisplay();
            }
        }, 1000);
    }
    
    stopProgressUpdates() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const miniProgressFill = document.getElementById('miniProgressFill');
        
        if (this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            
            if (progressFill) {
                progressFill.style.width = `${percentage}%`;
            }
            if (miniProgressFill) {
                miniProgressFill.style.width = `${percentage}%`;
            }
        }
    }
    
    updateTimeDisplay() {
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        }
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(this.duration);
        }
    }
    
    updatePlayPauseButton(isPlaying) {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const miniPlayPauseBtn = document.getElementById('miniPlayPauseBtn');
        
        const icon = isPlaying ? 'fa-pause' : 'fa-play';
        
        if (playPauseBtn) {
            const iconEl = playPauseBtn.querySelector('i');
            if (iconEl) {
                iconEl.className = `fas ${icon}`;
            }
        }
        
        if (miniPlayPauseBtn) {
            const iconEl = miniPlayPauseBtn.querySelector('i');
            if (iconEl) {
                iconEl.className = `fas ${icon}`;
            }
        }
    }
    
    updateVolumeIcon() {
        const volumeBtn = document.getElementById('volumeBtn');
        const miniVolumeBtn = document.getElementById('miniVolumeBtn');
        
        let icon = 'fa-volume-up';
        if (this.isMuted || this.volume === 0) {
            icon = 'fa-volume-mute';
        } else if (this.volume < 50) {
            icon = 'fa-volume-down';
        }
        
        [volumeBtn, miniVolumeBtn].forEach(btn => {
            if (btn) {
                const iconEl = btn.querySelector('i');
                if (iconEl) {
                    iconEl.className = `fas ${icon}`;
                }
            }
        });
    }
    
    updateTrackInfo() {
        // Update current track info in sidebar
        const trackTitle = document.querySelector('.track-details h2');
        const trackArtist = document.querySelector('.track-details .track-artist');
        const trackThumbnail = document.querySelector('.track-thumbnail img');
        
        if (trackTitle) trackTitle.textContent = this.currentTitle;
        if (trackArtist) trackArtist.textContent = this.currentArtist;
        if (trackThumbnail) trackThumbnail.src = this.currentThumbnail;
    }
    
    updateMiniPlayer() {
        const miniTrackTitle = document.getElementById('miniTrackTitle');
        const miniTrackArtist = document.getElementById('miniTrackArtist');
        const miniTrackThumbnail = document.getElementById('miniTrackThumbnail');
        
        if (miniTrackTitle) miniTrackTitle.textContent = this.currentTitle || 'No track selected';
        if (miniTrackArtist) miniTrackArtist.textContent = this.currentArtist || '-';
        if (miniTrackThumbnail) {
            miniTrackThumbnail.src = this.currentThumbnail || 'https://via.placeholder.com/50x50/1e293b/64748b?text=♪';
            miniTrackThumbnail.alt = this.currentTitle || 'Track thumbnail';
        }
    }
    
    showMiniPlayer() {
        const miniPlayer = document.getElementById('miniPlayer');
        if (miniPlayer) {
            miniPlayer.classList.remove('d-none');
        }
    }
    
    hideMiniPlayer() {
        const miniPlayer = document.getElementById('miniPlayer');
        if (miniPlayer) {
            miniPlayer.classList.add('d-none');
        }
    }
    
    openFullPlayer() {
        if (this.currentVideoId) {
            window.location.href = `/player/${this.currentVideoId}`;
        }
    }
    
    updateQueueUI() {
        const queueList = document.getElementById('queueList');
        if (!queueList) return;
        
        if (this.queue.length === 0) {
            queueList.innerHTML = `
                <div class="empty-queue">
                    <i class="fas fa-music"></i>
                    <p>No songs in queue</p>
                    <small>Add songs to keep the music playing</small>
                </div>
            `;
            return;
        }
        
        const queueHTML = this.queue.map((track, index) => `
            <div class="queue-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="queue-thumbnail">
                    <img src="${track.thumbnail}" alt="${track.title}">
                    ${index === this.currentIndex ? '<div class="playing-indicator"><i class="fas fa-volume-up"></i></div>' : ''}
                </div>
                <div class="queue-info">
                    <h6 class="queue-title">${track.title}</h6>
                    <p class="queue-artist">${track.artist}</p>
                </div>
                <button class="btn btn-link btn-sm" onclick="musicPlayer.removeFromQueue(${index})" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        queueList.innerHTML = queueHTML;
    }
    
    startAudioWaves() {
        const waves = document.querySelectorAll('.sound-waves .wave');
        waves.forEach(wave => {
            wave.classList.add('active');
        });
    }
    
    stopAudioWaves() {
        const waves = document.querySelectorAll('.sound-waves .wave');
        waves.forEach(wave => {
            wave.classList.remove('active');
        });
    }
    
    addToHistory(videoId, title, artist, thumbnail) {
        const historyItem = { videoId, title, artist, thumbnail, timestamp: Date.now() };
        
        let history = JSON.parse(localStorage.getItem('musicPlayerHistory') || '[]');
        
        // Remove if already exists
        history = history.filter(item => item.videoId !== videoId);
        
        // Add to beginning
        history.unshift(historyItem);
        
        // Keep only last 50 items
        history = history.slice(0, 50);
        
        localStorage.setItem('musicPlayerHistory', JSON.stringify(history));
    }
    
    getHistory() {
        return JSON.parse(localStorage.getItem('musicPlayerHistory') || '[]');
    }
    
    restoreSettings() {
        // Restore volume
        const savedVolume = localStorage.getItem('musicPlayerVolume');
        if (savedVolume) {
            this.volume = parseInt(savedVolume);
            const volumeSlider = document.getElementById('volumeRange');
            if (volumeSlider) {
                volumeSlider.value = this.volume;
            }
        }
        
        // Restore shuffle
        const savedShuffle = localStorage.getItem('musicPlayerShuffle');
        if (savedShuffle) {
            this.isShuffleOn = savedShuffle === 'true';
            const shuffleBtn = document.getElementById('shuffleBtn');
            if (shuffleBtn) {
                shuffleBtn.classList.toggle('active', this.isShuffleOn);
            }
        }
        
        // Restore repeat mode
        const savedRepeat = localStorage.getItem('musicPlayerRepeat');
        if (savedRepeat) {
            this.repeatMode = savedRepeat;
            this.updateRepeatButton();
        }
    }
    
    updateRepeatButton() {
        const repeatBtn = document.getElementById('repeatBtn');
        if (!repeatBtn) return;
        
        repeatBtn.classList.remove('active');
        const icon = repeatBtn.querySelector('i');
        
        if (icon) {
            switch(this.repeatMode) {
                case 'one':
                    icon.className = 'fas fa-redo';
                    repeatBtn.classList.add('active');
                    break;
                case 'all':
                    icon.className = 'fas fa-retweet';
                    repeatBtn.classList.add('active');
                    break;
                default:
                    icon.className = 'fas fa-redo';
                    break;
            }
        }
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Global functions for template usage
function updateMiniPlayer(videoId, title, artist, thumbnail) {
    if (window.musicPlayer) {
        window.musicPlayer.currentVideoId = videoId;
        window.musicPlayer.currentTitle = title;
        window.musicPlayer.currentArtist = artist;
        window.musicPlayer.currentThumbnail = thumbnail;
        window.musicPlayer.updateMiniPlayer();
    }
}

function showMiniPlayer() {
    if (window.musicPlayer) {
        window.musicPlayer.showMiniPlayer();
    }
}

function hideMiniPlayer() {
    if (window.musicPlayer) {
        window.musicPlayer.hideMiniPlayer();
    }
}

function playTrack(videoId, title, artist, thumbnail) {
    if (window.musicPlayer) {
        window.musicPlayer.playTrack(videoId, title, artist, thumbnail);
    } else {
        // Fallback: navigate to player page
        window.location.href = `/player/${videoId}`;
    }
}

function addToQueue(videoId, title, artist, thumbnail) {
    if (window.musicPlayer) {
        window.musicPlayer.addToQueue(videoId, title, artist, thumbnail);
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the global music player instance
    window.musicPlayer = new MusicPlayer();
    
    // Setup player mode toggle on player page
    const videoModeBtn = document.getElementById('videoMode');
    const audioModeBtn = document.getElementById('audioMode');
    
    if (videoModeBtn && audioModeBtn) {
        videoModeBtn.addEventListener('change', function() {
            if (this.checked) {
                window.musicPlayer.switchPlayerMode('video');
            }
        });
        
        audioModeBtn.addEventListener('change', function() {
            if (this.checked) {
                window.musicPlayer.switchPlayerMode('audio');
            }
        });
    }
    
    // Setup control buttons on player page
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => window.musicPlayer.toggleShuffle());
    }
    
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => window.musicPlayer.toggleRepeat());
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => window.musicPlayer.playPrevious());
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => window.musicPlayer.playNext());
    }
    
    // Setup fullscreen button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            const playerWrapper = document.querySelector('.player-wrapper');
            if (playerWrapper) {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    playerWrapper.requestFullscreen().catch(err => {
                        console.log('Error attempting to enable fullscreen:', err);
                    });
                }
            }
        });
    }
    
    console.log('Music Player initialized');
});
