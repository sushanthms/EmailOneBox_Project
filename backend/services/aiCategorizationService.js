class AICategorizationService {
  categorizeEmail(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();

    // Meeting Booked
    if (text.match(/meeting|schedule|calendar|zoom|meet|appointment|booked|confirmed/i)) {
      return 'Meeting Booked';
    }
    
    // Interested
    if (text.match(/interested|love to|would like|looking forward|excited|keen|sounds good/i)) {
      return 'Interested';
    }
    
    // Spam
    if (text.match(/unsubscribe|opt-out|viagra|casino|prize|lottery|winner|claim now|click here/i)) {
      return 'Spam';
    }
    
    // Out of Office
    if (text.match(/out of office|away|vacation|ooo|auto-reply|automatic reply|not available/i)) {
      return 'Out of Office';
    }
    
    // Not Interested
    if (text.match(/not interested|no thank|remove me|stop|unsubscribe|decline|pass/i)) {
      return 'Not Interested';
    }

    // Default
    return 'Not Interested';
  }
}

module.exports = new AICategorizationService();