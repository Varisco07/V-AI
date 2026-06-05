export default function UserAvatar({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#userGradient)" opacity="0.15" />
      <circle cx="50" cy="50" r="48" stroke="url(#userGradient)" strokeWidth="2" opacity="0.3" />
      
      {/* User icon */}
      <circle cx="50" cy="38" r="14" fill="url(#userGradient)" />
      <path 
        d="M 25 75 Q 25 58, 50 58 Q 75 58, 75 75" 
        fill="url(#userGradient)"
      />
    </svg>
  )
}
