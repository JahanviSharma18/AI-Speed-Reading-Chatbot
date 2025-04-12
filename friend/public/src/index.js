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
      
      // Replace the existing fetchAIResponse function with this updated version
fetchAIResponse(question) {
// This is where you'll make the actual API call to your backend
// Example using fetch:
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