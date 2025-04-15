function chatApp() {
  return {
      messages: [
          {
              sender: 'assistant',
              content: 'Hello! I\'m your Speed Reading AI assistant. I can help you improve your reading speed and comprehension. What would you like to learn today?',
              wpm: null
          }
      ],
      userInput: '',
      isLoading: false,
      currentWPM: 250,
      speakingIndex: null, // Added for TTS
      utterance: null, // Added for TTS

      // Added: Clean HTML tags for TTS
      stripHTML(html) {
          const div = document.createElement('div');
          div.innerHTML = html;
          return div.textContent || div.innerText || '';
      },

      // Added: Toggle speech for a message
      toggleSpeech(index) {
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
                  this.utterance.rate = 1.2; // Slightly faster for speed reading
                  this.utterance.pitch = 1;
                  this.utterance.volume = 1;

                  // Select a voice
                  const voices = window.speechSynthesis.getVoices();
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
          // This is where you'll make the actual API call to your backend
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

              // Process the backend response which has format {message: reply}
              if (data && data.message) {
                  // Add AI response
                  const htmlContent = marked.parse(data.message);
                  this.messages.push({
                      sender: 'assistant',
                      content: htmlContent,
                      wpm: data.wpm || this.currentWPM // Use wpm from backend if provided, otherwise use current
                  });
                  
                  // Update current reading speed if provided
                  if (data.wpm) {
                      this.currentWPM = data.wpm;
                  }
              } else {
                  // Fallback for unexpected response format
                  this.messages.push({
                      sender: 'assistant',
                      content: 'Sorry, I encountered an error processing your request.',
                      wpm: this.currentWPM
                  });
              }

              // Scroll to bottom
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