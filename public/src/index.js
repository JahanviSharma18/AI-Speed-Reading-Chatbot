function chatApp() {
    return {
        messages: JSON.parse(localStorage.getItem('chatMessages')) || [
            {
                sender: 'assistant',
                content: 'Hello! I\'m your Speed Reading AI assistant. I can help you improve your reading speed and comprehension. What would you like to learn today?',
                wpm: null
            }
        ],
        userInput: '',
        isLoading: false,
        currentWPM: 250,
        speakingIndex: null,
        utterance: null,
        totalWords: 0,
        sessionCount: parseInt(localStorage.getItem('sessionCount')) || 0,
        averageWPM: 0,

        // Clean HTML tags for TTS and word counting
        stripHTML(html) {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        },

        // Initialize stats and other setup
        init() {
            this.sessionCount++;
            localStorage.setItem('sessionCount', this.sessionCount);
            this.updateStats();
            this.scrollToBottom();
            window.speechSynthesis.onvoiceschanged = () => {};
        },

        // Update progress stats
        updateStats() {
            this.totalWords = this.messages
                .filter(m => m.sender === 'assistant')
                .reduce((sum, m) => sum + this.stripHTML(m.content).split(/\s+/).length, 0);
            const wpms = this.messages.filter(m => m.wpm).map(m => m.wpm);
            this.averageWPM = wpms.length ? wpms.reduce((sum, w) => sum + w, 0) / wpms.length : this.currentWPM;
        },

        // Handle file upload
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                this.userInput = reader.result;
                this.sendMessage();
                event.target.value = ''; // Reset input
            };
            reader.readAsText(file);
        },

        // Toggle speech for a message
        toggleSpeech(index) {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) {
                window.speechSynthesis.onvoiceschanged = () => {
                    this.toggleSpeech(index);
                };
                return;
            }

            if (this.speakingIndex === index) {
                // Stop speech
                window.speechSynthesis.cancel();
                this.speakingIndex = null;
                this.utterance = null;
                return;
            }

            // Stop any ongoing speech
            if (this.speakingIndex !== null) {
                window.speechSynthesis.cancel();
                this.speakingIndex = null;
            }

            // Start new speech
            const message = this.messages[index];
            if (message.sender === 'assistant') {
                const text = this.stripHTML(message.content);
                if (text && 'speechSynthesis' in window) {
                    this.utterance = new SpeechSynthesisUtterance(text);
                    this.utterance.rate = 1.2;
                    this.utterance.pitch = 1;
                    this.utterance.volume = 1;

                    // Select a voice
                    const preferredVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
                    if (preferredVoice) this.utterance.voice = preferredVoice;

                    // Handle speech end
                    this.utterance.onend = () => {
                        this.speakingIndex = null;
                        this.utterance = null;
                    };

                    // Start speaking
                    window.speechSynthesis.speak(this.utterance);
                    this.speakingIndex = index;
                } else {
                    this.messages.push({
                        sender: 'assistant',
                        content: 'Text-to-Speech is not available in this browser.',
                        wpm: this.currentWPM
                    });
                    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
                    this.updateStats();
                    this.scrollToBottom();
                }
            }
        },

        sendMessage() {
            if (!this.userInput || this.userInput.trim() === '') {
                return;
            }
            
            console.log("Sending message:", this.userInput);
            
            // Add user message
            this.messages.push({
                sender: 'user',
                content: this.userInput.trim(),
                wpm: null
            });
            localStorage.setItem('chatMessages', JSON.stringify(this.messages));
            this.updateStats();
            
            const userQuestion = this.userInput;
            this.userInput = '';
            this.isLoading = true;
            
            // Scroll to bottom
            this.scrollToBottom();
            
            // Simulate API call
            setTimeout(() => {
                this.fetchAIResponse(userQuestion);
            }, 1000);
        },
        
        fetchAIResponse(question) {
            // Make API call to backend
            fetch('/api/server', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: question 
                })
            })
            .then(response => response.json())
            .then(data => {
                this.isLoading = false;

                // Process backend response
                if (data && data.message) {
                    // Add AI response
                    const htmlContent = marked.parse(data.message);
                    this.messages.push({
                        sender: 'assistant',
                        content: htmlContent,
                        wpm: data.wpm || this.currentWPM
                    });
                    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
                    
                    // Update current reading speed if provided
                    if (data.wpm) {
                        this.currentWPM = data.wpm;
                    }
                } else {
                    // Fallback for unexpected response
                    this.messages.push({
                        sender: 'assistant',
                        content: 'Sorry, I encountered an error processing your request.',
                        wpm: this.currentWPM
                    });
                    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
                }

                this.updateStats();
                this.scrollToBottom();
            })
            .catch(error => {
                console.error('Error fetching response:', error);
                this.isLoading = false;

                // Error handling
                this.messages.push({
                    sender: 'assistant',
                    content: 'Sorry, I had trouble connecting to the server. Please try again later.',
                    wpm: this.currentWPM
                });
                localStorage.setItem('chatMessages', JSON.stringify(this.messages));

                this.updateStats();
                this.scrollToBottom();
            });
        },
        
        scrollToBottom() {
            setTimeout(() => {
                const container = document.getElementById('chat-container');
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }
}