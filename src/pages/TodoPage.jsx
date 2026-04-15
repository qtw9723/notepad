import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, BellOff } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import { usePush } from '../hooks/usePush'
import { useNotes } from '../hooks/useNotes'
import { TodoSidebar } from '../components/todo/TodoSidebar'
import { TodoBoard } from '../components/todo/TodoBoard'

export function TodoPage({ user }) {
  const [selectedListId, setSelectedListId] = useState(null)
  const {
    lists, loading, error,
    createList, updateList, deleteList,
    createItem, updateItem, deleteItem, reorderItems,
    getItemsByList,
  } = useTodos(user)
  const { notes, fetchNote } = useNotes(user)

  const { supported, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePush(user)

  const selectedList = lists.find(l => l.id === selectedListId) ?? null
  const items = selectedListId ? getItemsByList(selectedListId) : []

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <p className="text-[14px] mb-4" style={{ color: '#8b949e' }}>로그인이 필요합니다</p>
          <Link to="/" className="text-[13px]" style={{ color: '#9d8ffc' }}>← 노트패드로 돌아가기</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0d1117' }}>
      {/* top bar */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: '#0d0d14', borderBottom: '1px solid #21262d', height: 52 }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-80"
            style={{ color: '#606070' }}
          >
            <ArrowLeft size={14} />
            노트패드
          </Link>
          <span style={{ color: '#21262d' }}>|</span>
          <span className="text-[13px] font-medium" style={{ color: '#cdd9e5' }}>Todo</span>
        </div>

        {/* push toggle */}
        {supported && (
          <button
            onClick={subscribed ? unsubscribe : subscribe}
            disabled={pushLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
            style={{
              background: subscribed ? 'rgba(157,143,252,0.1)' : '#161b22',
              border: `1px solid ${subscribed ? 'rgba(157,143,252,0.3)' : '#21262d'}`,
              color: subscribed ? '#9d8ffc' : '#8b949e',
              opacity: pushLoading ? 0.5 : 1,
            }}
            title={subscribed ? '알림 끄기' : '알림 켜기'}
          >
            {subscribed ? <Bell size={13} /> : <BellOff size={13} />}
            {subscribed ? '알림 켜짐' : '알림 꺼짐'}
          </button>
        )}
      </div>

      {/* main */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <span className="text-[13px]" style={{ color: '#606070' }}>불러오는 중...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <span className="text-[13px]" style={{ color: 'rgb(248,113,113)' }}>{error}</span>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <TodoSidebar
            lists={lists}
            selectedListId={selectedListId}
            onSelectList={setSelectedListId}
            onCreateList={createList}
            onDeleteList={deleteList}
            user={user}
          />
          <TodoBoard
            list={selectedList}
            items={items}
            notes={notes}
            fetchNote={fetchNote}
            onCreateItem={createItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />
        </div>
      )}
    </div>
  )
}
