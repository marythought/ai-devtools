import type { User } from '@interview/shared'

interface UserPresenceProps {
  users: User[]
  isConnected: boolean
  onChangeName?: () => void
}

export default function UserPresence({ users, isConnected, onChangeName }: UserPresenceProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-400">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {users.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Users:</span>
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full bg-blue-600 border-2 border-gray-800 flex items-center justify-center text-xs font-semibold text-white"
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs font-semibold text-gray-300">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {onChangeName && (
        <button
          onClick={onChangeName}
          className="text-xs text-gray-400 hover:text-gray-300 underline"
          title="Change your name"
        >
          Change name
        </button>
      )}
    </div>
  )
}
