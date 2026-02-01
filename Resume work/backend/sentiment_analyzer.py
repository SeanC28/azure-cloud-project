"""
AI Sentiment Analysis Module
Uses TextBlob for sentiment analysis and spam detection
"""
from textblob import TextBlob
import re
from typing import Dict, Tuple

class SentimentAnalyzer:
    
    # Spam indicators (common spam keywords)
    SPAM_KEYWORDS = [
        'viagra', 'casino', 'lottery', 'prize', 'winner', 'click here',
        'act now', 'limited time', 'free money', 'earn cash', 'work from home',
        'bitcoin', 'crypto investment', 'guaranteed', 'no risk', 'double your',
        'weight loss', 'get rich', 'make money fast', 'nigerian prince',
        'inheritance', 'tax refund', 'claim now', 'congratulations'
    ]
    
    # Urgency indicators (high priority keywords)
    URGENT_KEYWORDS = [
        'urgent', 'asap', 'immediately', 'critical', 'emergency',
        'security', 'breach', 'down', 'error', 'broken', 'not working',
        'interview', 'job offer', 'opportunity', 'hiring', 'deadline'
    ]

    # Keyword-based fallback for sentiment
    POSITIVE_WORDS = [
        'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
        'perfect', 'awesome', 'brilliant', 'outstanding', 'thank', 'thanks',
        'happy', 'good', 'nice', 'best', 'impressive', 'enjoy', 'enjoyed'
    ]

    NEGATIVE_WORDS = [
        'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'broken',
        'error', 'fail', 'failed', 'problem', 'issue', 'bug', 'wrong',
        'disappointed', 'frustrating', 'angry', 'annoyed', 'useless'
    ]
    
    @staticmethod
    def analyze(subject: str, message: str) -> Dict:
        """
        Analyze message for spam, sentiment, and priority
        
        Args:
            subject: Email subject line
            message: Email message body
        
        Returns:
            {
                'is_spam': bool,
                'spam_score': float (0-1),
                'sentiment': str ('positive', 'neutral', 'negative'),
                'sentiment_score': float (-1 to 1),
                'priority': str ('high', 'medium', 'low'),
                'priority_score': int (1-10)
            }
        """
        combined_text = f"{subject} {message}".lower()
        
        # 1. Spam Detection
        spam_score, is_spam = SentimentAnalyzer._detect_spam(combined_text)
        
        # 2. Sentiment Analysis
        sentiment, sentiment_score = SentimentAnalyzer._analyze_sentiment(combined_text)
        
        # 3. Priority Scoring
        priority, priority_score = SentimentAnalyzer._calculate_priority(
            combined_text, sentiment_score, is_spam
        )
        
        return {
            'is_spam': is_spam,
            'spam_score': round(spam_score, 3),
            'sentiment': sentiment,
            'sentiment_score': round(sentiment_score, 3),
            'priority': priority,
            'priority_score': priority_score,
            'analysis_version': '1.0'
        }
    
    @staticmethod
    def _detect_spam(text: str) -> Tuple[float, bool]:
        """
        Detect spam based on keywords and patterns
        
        Returns:
            (spam_score, is_spam) - score from 0-1, boolean classification
        """
        spam_count = 0
        
        # Check for spam keywords
        for keyword in SentimentAnalyzer.SPAM_KEYWORDS:
            if keyword in text:
                spam_count += 1
        
        # Check for suspicious patterns
        if re.search(r'http[s]?://.*http[s]?://', text):  # Multiple URLs
            spam_count += 2
        if re.search(r'(.)\1{4,}', text):  # Repeated characters (!!!!!!)
            spam_count += 1
        if len(text) > 50 and text.isupper():  # ALL CAPS long message
            spam_count += 1
        if re.search(r'\$\$+', text):  # Multiple dollar signs
            spam_count += 1
        
        # Calculate spam score (0-1)
        spam_score = min(spam_count / 5, 1.0)
        is_spam = spam_score > 0.5
        
        return spam_score, is_spam
    
    @staticmethod
    def _analyze_sentiment(text: str) -> Tuple[str, float]:
        """
        Analyze sentiment using TextBlob NLP with keyword fallback.
        TextBlob polarity works without corpora for basic detection,
        but if it fails for any reason we fall back to keyword matching.
        
        Returns:
            (sentiment_label, polarity_score)
        """
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # -1 (negative) to 1 (positive)
        except Exception:
            # Fallback: keyword-based sentiment scoring
            polarity = SentimentAnalyzer._keyword_sentiment(text)

        # Classify sentiment
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return sentiment, polarity

    @staticmethod
    def _keyword_sentiment(text: str) -> float:
        """
        Fallback sentiment scoring using keyword matching.
        Returns polarity from -1 to 1.
        """
        pos_count = sum(1 for w in SentimentAnalyzer.POSITIVE_WORDS if w in text)
        neg_count = sum(1 for w in SentimentAnalyzer.NEGATIVE_WORDS if w in text)
        total = pos_count + neg_count
        if total == 0:
            return 0.0
        return round((pos_count - neg_count) / total, 3)
    
    @staticmethod
    def _calculate_priority(text: str, sentiment_score: float, is_spam: bool) -> Tuple[str, int]:
        """
        Calculate message priority on 1-10 scale
        
        Returns:
            (priority_label, priority_score)
        """
        if is_spam:
            return 'low', 1
        
        priority_score = 5  # Default: medium
        
        # Boost for urgent keywords
        urgency_count = sum(1 for keyword in SentimentAnalyzer.URGENT_KEYWORDS if keyword in text)
        priority_score += min(urgency_count * 2, 3)
        
        # Boost for negative sentiment (might be complaint/issue)
        if sentiment_score < -0.3:
            priority_score += 2
        
        # Slight reduction for very positive (might be thank you note)
        if sentiment_score > 0.5:
            priority_score -= 1
        
        # Boost for question marks (asking for help)
        question_count = text.count('?')
        if question_count >= 2:
            priority_score += 1
        
        # Cap at 1-10
        priority_score = max(1, min(10, priority_score))
        
        # Classify priority
        if priority_score >= 8:
            priority = 'high'
        elif priority_score >= 5:
            priority = 'medium'
        else:
            priority = 'low'
        
        return priority, priority_score