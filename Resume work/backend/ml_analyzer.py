"""
Machine Learning analyzer for contact form messages
Detects spam, analyzes sentiment, and classifies messages
"""

import logging
from typing import Dict, Any
import re

try:
    from transformers import pipeline
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    logging.warning("ML libraries not available - using rule-based fallback")


class MessageAnalyzer:
    """Analyzes contact form messages using AI"""
    
    def __init__(self):
        """Initialize ML models"""
        self.sentiment_analyzer = None
        self.zero_shot_classifier = None
        
        if ML_AVAILABLE:
            try:
                # Load pre-trained models (lightweight versions)
                logging.info("Loading ML models...")
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english"
                )
                self.zero_shot_classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli"
                )
                logging.info("ML models loaded successfully")
            except Exception as e:
                logging.error(f"Failed to load ML models: {e}")
                ML_AVAILABLE = False
    
    def analyze_message(self, name: str, email: str, subject: str, message: str) -> Dict[str, Any]:
        """
        Comprehensive message analysis
        
        Returns:
            {
                "is_spam": bool,
                "spam_score": float (0-1),
                "sentiment": str ("positive"/"negative"/"neutral"),
                "sentiment_score": float (0-1),
                "category": str ("job_inquiry"/"collaboration"/"question"/"spam"),
                "priority": str ("urgent"/"normal"/"low"),
                "flags": list of warning flags,
                "confidence": float (0-1)
            }
        """
        
        # Combine text for analysis
        full_text = f"{subject} {message}"
        
        # Run spam detection
        spam_result = self._detect_spam(name, email, subject, message)
        
        # If definitely spam, skip expensive ML analysis
        if spam_result['is_spam'] and spam_result['spam_score'] > 0.9:
            return {
                **spam_result,
                "sentiment": "negative",
                "sentiment_score": 0.0,
                "category": "spam",
                "priority": "low",
                "flags": spam_result['flags']
            }
        
        # Run sentiment analysis
        sentiment_result = self._analyze_sentiment(full_text)
        
        # Classify message category
        category_result = self._classify_category(subject, message)
        
        # Determine priority
        priority = self._calculate_priority(
            sentiment_result,
            category_result,
            spam_result
        )
        
        return {
            **spam_result,
            **sentiment_result,
            **category_result,
            "priority": priority,
            "confidence": min(
                spam_result.get('confidence', 0.5),
                sentiment_result.get('confidence', 0.5),
                category_result.get('confidence', 0.5)
            )
        }
    
    def _detect_spam(self, name: str, email: str, subject: str, message: str) -> Dict[str, Any]:
        """Detect spam using rules and patterns"""
        flags = []
        spam_score = 0.0
        
        # Spam indicators
        spam_keywords = [
            'lottery', 'winner', 'prize', 'congratulations', 'claim',
            'bitcoin', 'cryptocurrency', 'investment opportunity',
            'prince', 'inheritance', 'million dollars', 'wire transfer',
            'click here', 'act now', 'limited time', 'free money',
            'viagra', 'cialis', 'weight loss', 'make money fast'
        ]
        
        text_lower = f"{subject} {message}".lower()
        
        # Check for spam keywords
        keyword_matches = sum(1 for keyword in spam_keywords if keyword in text_lower)
        if keyword_matches > 0:
            spam_score += min(keyword_matches * 0.2, 0.6)
            flags.append(f"Contains {keyword_matches} spam keyword(s)")
        
        # Excessive caps
        if subject and subject.isupper() and len(subject) > 5:
            spam_score += 0.2
            flags.append("Subject all caps")
        
        # Too many exclamation marks
        exclamation_count = message.count('!')
        if exclamation_count > 3:
            spam_score += 0.1
            flags.append(f"Excessive exclamation marks ({exclamation_count})")
        
        # Suspicious email patterns
        suspicious_domains = ['temp', 'disposable', 'throwaway', '10minutemail']
        if any(domain in email.lower() for domain in suspicious_domains):
            spam_score += 0.3
            flags.append("Suspicious email domain")
        
        # Too many URLs
        url_count = len(re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+])+', message))
        if url_count > 2:
            spam_score += 0.2
            flags.append(f"Multiple URLs ({url_count})")
        
        # Very short message with URL
        if len(message.split()) < 10 and url_count > 0:
            spam_score += 0.2
            flags.append("Short message with URL")
        
        # Nonsense name (all numbers, single char, etc.)
        if name.isdigit() or len(name) < 2:
            spam_score += 0.15
            flags.append("Suspicious name")
        
        is_spam = spam_score >= 0.5
        
        return {
            "is_spam": is_spam,
            "spam_score": min(spam_score, 1.0),
            "flags": flags,
            "confidence": 0.8 if flags else 0.5
        }
    
    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of message"""
        
        if ML_AVAILABLE and self.sentiment_analyzer:
            try:
                # Use AI model
                result = self.sentiment_analyzer(text[:512])[0]  # Limit text length
                
                sentiment = result['label'].lower()  # 'positive' or 'negative'
                score = result['score']
                
                return {
                    "sentiment": sentiment,
                    "sentiment_score": score,
                    "confidence": score
                }
            except Exception as e:
                logging.error(f"Sentiment analysis failed: {e}")
        
        # Fallback: Rule-based sentiment
        positive_words = ['thank', 'great', 'excellent', 'love', 'appreciate', 'interested', 'opportunity']
        negative_words = ['angry', 'terrible', 'awful', 'hate', 'complaint', 'problem', 'issue']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = "positive"
            score = min(positive_count * 0.2, 0.8)
        elif negative_count > positive_count:
            sentiment = "negative"
            score = min(negative_count * 0.2, 0.8)
        else:
            sentiment = "neutral"
            score = 0.5
        
        return {
            "sentiment": sentiment,
            "sentiment_score": score,
            "confidence": 0.6
        }
    
    def _classify_category(self, subject: str, message: str) -> Dict[str, Any]:
        """Classify message into categories"""
        
        text = f"{subject} {message}".lower()
        
        if ML_AVAILABLE and self.zero_shot_classifier:
            try:
                # Use AI for classification
                categories = [
                    "job opportunity",
                    "collaboration request",
                    "technical question",
                    "general inquiry"
                ]
                
                result = self.zero_shot_classifier(
                    text[:512],
                    categories,
                    multi_label=False
                )
                
                category_map = {
                    "job opportunity": "job_inquiry",
                    "collaboration request": "collaboration",
                    "technical question": "question",
                    "general inquiry": "question"
                }
                
                top_category = result['labels'][0]
                confidence = result['scores'][0]
                
                return {
                    "category": category_map.get(top_category, "question"),
                    "confidence": confidence
                }
            except Exception as e:
                logging.error(f"Category classification failed: {e}")
        
        # Fallback: Rule-based classification
        if any(word in text for word in ['job', 'position', 'hiring', 'opportunity', 'role', 'career']):
            return {"category": "job_inquiry", "confidence": 0.7}
        elif any(word in text for word in ['collaborate', 'partnership', 'together', 'project']):
            return {"category": "collaboration", "confidence": 0.7}
        elif any(word in text for word in ['how', 'what', 'why', 'question', 'help']):
            return {"category": "question", "confidence": 0.6}
        else:
            return {"category": "general", "confidence": 0.5}
    
    def _calculate_priority(self, sentiment: Dict, category: Dict, spam: Dict) -> str:
        """Calculate message priority"""
        
        # Spam is always low priority
        if spam['is_spam']:
            return "low"
        
        # Job inquiries are high priority
        if category.get('category') == 'job_inquiry':
            return "urgent"
        
        # Negative sentiment might be urgent (complaints)
        if sentiment.get('sentiment') == 'negative' and sentiment.get('sentiment_score', 0) > 0.7:
            return "urgent"
        
        # Collaboration is normal priority
        if category.get('category') == 'collaboration':
            return "normal"
        
        # Default to normal
        return "normal"


# Global analyzer instance
_analyzer = None

def get_analyzer() -> MessageAnalyzer:
    """Get or create analyzer instance"""
    global _analyzer
    if _analyzer is None:
        _analyzer = MessageAnalyzer()
    return _analyzers