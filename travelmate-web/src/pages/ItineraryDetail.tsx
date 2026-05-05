import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { authService } from '../services/authService';
import {
  getItinerary,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
  toggleLike,
  Itinerary,
  ItineraryItem,
  ItemType,
  BookingStatus,
  CreateItemRequest,
  UpdateItemRequest,
  ReorderItemRequest,
} from '../services/itineraryService';
import './ItineraryDetail.css';

// ── Item type metadata ──────────────────────────────────────────────────────

const ITEM_ICONS: Record<ItemType, string> = {
  ATTRACTION: '🏛️',
  RESTAURANT: '🍽️',
  CAFE: '☕',
  ACCOMMODATION: '🏨',
  TRANSPORTATION: '🚌',
  ACTIVITY: '🎯',
  SHOPPING: '🛍️',
  FREE_TIME: '🌿',
  NOTE: '📝',
  OTHER: '📌',
};
const ITEM_LABELS: Record<ItemType, string> = {
  ATTRACTION: '명소',
  RESTAURANT: '식당',
  CAFE: '카페',
  ACCOMMODATION: '숙소',
  TRANSPORTATION: '교통',
  ACTIVITY: '액티비티',
  SHOPPING: '쇼핑',
  FREE_TIME: '자유시간',
  NOTE: '메모',
  OTHER: '기타',
};
const ALL_TYPES: ItemType[] = [
  'ATTRACTION',
  'RESTAURANT',
  'CAFE',
  'ACCOMMODATION',
  'TRANSPORTATION',
  'ACTIVITY',
  'SHOPPING',
  'FREE_TIME',
  'NOTE',
  'OTHER',
];
const BOOKING_LABELS: Record<BookingStatus, string> = {
  NOT_NEEDED: '예약불필요',
  PENDING: '예약예정',
  BOOKED: '예약완료',
  CANCELLED: '예약취소',
};

// ── Item form modal ─────────────────────────────────────────────────────────

interface ItemFormData {
  type: ItemType;
  title: string;
  description: string;
  notes: string;
  placeName: string;
  placeAddress: string;
  startTime: string;
  endTime: string;
  estimatedCost: string;
  currency: string;
  bookingStatus: BookingStatus;
  bookingUrl: string;
  imageUrl: string;
}

const DEFAULT_FORM: ItemFormData = {
  type: 'ATTRACTION',
  title: '',
  description: '',
  notes: '',
  placeName: '',
  placeAddress: '',
  startTime: '',
  endTime: '',
  estimatedCost: '',
  currency: 'KRW',
  bookingStatus: 'NOT_NEEDED',
  bookingUrl: '',
  imageUrl: '',
};

const ItemModal: React.FC<{
  initial?: ItemFormData;
  dayNumber: number;
  loading: boolean;
  onSave: (d: ItemFormData) => void;
  onClose: () => void;
}> = ({ initial = DEFAULT_FORM, dayNumber, loading, onSave, onClose }) => {
  const [form, setForm] = useState<ItemFormData>(initial);
  const set = (k: keyof ItemFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="itin-modal-overlay" onClick={onClose}>
      <motion.div
        className="itin-modal-content itin-item-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2>{initial === DEFAULT_FORM ? `Day ${dayNumber} — 새 일정 추가` : '일정 수정'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave(form);
          }}
        >
          {/* Type */}
          <div className="itin-form-group">
            <label>유형</label>
            <div className="itin-type-grid">
              {ALL_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`itin-type-btn ${form.type === t ? 'active' : ''}`}
                  onClick={() => set('type', t)}
                >
                  {ITEM_ICONS[t]} {ITEM_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          {/* Title */}
          <div className="itin-form-group">
            <label>제목 *</label>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="장소나 활동 이름"
            />
          </div>
          {/* Times */}
          <div className="itin-form-row">
            <div className="itin-form-group">
              <label>시작 시간</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => set('startTime', e.target.value)}
              />
            </div>
            <div className="itin-form-group">
              <label>종료 시간</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => set('endTime', e.target.value)}
              />
            </div>
          </div>
          {/* Place */}
          <div className="itin-form-group">
            <label>장소명</label>
            <input
              value={form.placeName}
              onChange={e => set('placeName', e.target.value)}
              placeholder="장소 이름"
            />
          </div>
          <div className="itin-form-group">
            <label>주소</label>
            <input
              value={form.placeAddress}
              onChange={e => set('placeAddress', e.target.value)}
              placeholder="주소"
            />
          </div>
          {/* Description & Notes */}
          <div className="itin-form-group">
            <label>설명</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="간단한 설명"
              rows={2}
            />
          </div>
          <div className="itin-form-group">
            <label>메모</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="개인 메모"
              rows={2}
            />
          </div>
          {/* Cost */}
          <div className="itin-form-row">
            <div className="itin-form-group">
              <label>예상 비용</label>
              <input
                type="number"
                min="0"
                value={form.estimatedCost}
                onChange={e => set('estimatedCost', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="itin-form-group">
              <label>통화</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}>
                {['KRW', 'USD', 'EUR', 'JPY', 'CNY', 'GBP'].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Booking */}
          <div className="itin-form-row">
            <div className="itin-form-group">
              <label>예약 상태</label>
              <select
                value={form.bookingStatus}
                onChange={e => set('bookingStatus', e.target.value as BookingStatus)}
              >
                {(Object.keys(BOOKING_LABELS) as BookingStatus[]).map(s => (
                  <option key={s} value={s}>
                    {BOOKING_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="itin-form-group">
              <label>예약 URL</label>
              <input
                value={form.bookingUrl}
                onChange={e => set('bookingUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          {/* Image */}
          <div className="itin-form-group">
            <label>사진 URL</label>
            <input
              value={form.imageUrl}
              onChange={e => set('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="itin-modal-actions">
            <button type="button" className="itin-btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="itin-btn-primary" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Item card ───────────────────────────────────────────────────────────────

const ItemCard: React.FC<{
  item: ItineraryItem;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ item, canEdit, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }) => (
  <motion.div
    className="itin-item-card"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    layout
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
  >
    {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="itin-item-image" />}
    <div className="itin-item-body">
      <div className="itin-item-header">
        <span className="itin-item-icon">{ITEM_ICONS[item.type]}</span>
        <div className="itin-item-meta">
          <span className="itin-item-type-label">{ITEM_LABELS[item.type]}</span>
          {item.startTime && (
            <span className="itin-item-time">
              {item.startTime}
              {item.endTime ? ` ~ ${item.endTime}` : ''}
            </span>
          )}
        </div>
        {canEdit && (
          <div className="itin-item-actions">
            <button className="itin-icon-btn" onClick={onMoveUp} disabled={isFirst} title="위로">
              ↑
            </button>
            <button className="itin-icon-btn" onClick={onMoveDown} disabled={isLast} title="아래로">
              ↓
            </button>
            <button className="itin-icon-btn" onClick={onEdit} title="수정">
              ✏️
            </button>
            <button className="itin-icon-btn danger" onClick={onDelete} title="삭제">
              🗑️
            </button>
          </div>
        )}
      </div>
      <h4 className="itin-item-title">{item.title}</h4>
      {item.placeName && (
        <p className="itin-item-place">
          📍 {item.placeName}
          {item.placeAddress ? ` · ${item.placeAddress}` : ''}
        </p>
      )}
      {item.description && <p className="itin-item-desc">{item.description}</p>}
      {item.notes && <p className="itin-item-notes">📝 {item.notes}</p>}
      <div className="itin-item-footer">
        {item.estimatedCost != null && item.estimatedCost > 0 && (
          <span className="itin-item-cost">
            💰 {item.estimatedCost.toLocaleString()} {item.currency || 'KRW'}
          </span>
        )}
        {item.bookingStatus && item.bookingStatus !== 'NOT_NEEDED' && (
          <span className={`itin-booking-badge ${item.bookingStatus.toLowerCase()}`}>
            {BOOKING_LABELS[item.bookingStatus]}
          </span>
        )}
        {item.bookingUrl && (
          <a
            href={item.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="itin-booking-link"
          >
            예약 링크 →
          </a>
        )}
      </div>
    </div>
  </motion.div>
);

// ── Main page ───────────────────────────────────────────────────────────────

const ItineraryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [liking, setLiking] = useState(false);

  const isAuthenticated = authService.isAuthenticated();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getItinerary(Number(id));
      setItinerary(data);
    } catch {
      toast.error('일정을 불러오는 데 실패했습니다.');
      navigate('/itineraries');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit =
    !!itinerary &&
    (itinerary.isOwner ||
      (itinerary.collaborators?.some(
        c => c.status === 'ACCEPTED' && (c.role === 'EDITOR' || c.role === 'ADMIN')
      ) ??
        false));

  const dayItems = (day: number): ItineraryItem[] =>
    (itinerary?.items ?? [])
      .filter(i => i.dayNumber === day)
      .sort((a, b) => a.orderIndex - b.orderIndex);

  const handleAddItem = async (form: ItemFormData) => {
    if (!itinerary) return;
    setSaving(true);
    try {
      const req: CreateItemRequest = {
        dayNumber: activeDay,
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        notes: form.notes || undefined,
        placeName: form.placeName || undefined,
        placeAddress: form.placeAddress || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        currency: form.currency || undefined,
        bookingStatus: form.bookingStatus,
        bookingUrl: form.bookingUrl || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      const created = await addItem(itinerary.id, req);
      setItinerary(prev =>
        prev
          ? {
              ...prev,
              items: [...(prev.items ?? []), created],
              itemCount: prev.itemCount + 1,
            }
          : prev
      );
      setShowAddModal(false);
      toast.success('일정 항목이 추가되었습니다.');
    } catch {
      toast.error('추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = async (form: ItemFormData) => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const req: UpdateItemRequest = {
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        notes: form.notes || undefined,
        placeName: form.placeName || undefined,
        placeAddress: form.placeAddress || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        currency: form.currency || undefined,
        bookingStatus: form.bookingStatus,
        bookingUrl: form.bookingUrl || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      const updated = await updateItem(editingItem.id, req);
      setItinerary(prev =>
        prev
          ? {
              ...prev,
              items: (prev.items ?? []).map(i => (i.id === updated.id ? updated : i)),
            }
          : prev
      );
      setEditingItem(null);
      toast.success('수정되었습니다.');
    } catch {
      toast.error('수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: ItineraryItem) => {
    if (!window.confirm(`"${item.title}"을 삭제할까요?`)) return;
    try {
      await deleteItem(item.id);
      setItinerary(prev =>
        prev
          ? {
              ...prev,
              items: (prev.items ?? []).filter(i => i.id !== item.id),
              itemCount: prev.itemCount - 1,
            }
          : prev
      );
      toast.success('삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleMove = async (item: ItineraryItem, direction: 'up' | 'down') => {
    if (!itinerary) return;
    const items = dayItems(item.dayNumber);
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const reordered: ReorderItemRequest[] = [
      { itemId: item.id, dayNumber: item.dayNumber, orderIndex: swapIdx },
      { itemId: items[swapIdx].id, dayNumber: items[swapIdx].dayNumber, orderIndex: idx },
    ];
    try {
      await reorderItems(itinerary.id, reordered);
      setItinerary(prev => {
        if (!prev) return prev;
        const updated = (prev.items ?? []).map(i => {
          const r = reordered.find(r => r.itemId === i.id);
          return r ? { ...i, orderIndex: r.orderIndex } : i;
        });
        return { ...prev, items: updated };
      });
    } catch {
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  const handleLike = async () => {
    if (!itinerary || !isAuthenticated) {
      navigate('/login');
      return;
    }
    setLiking(true);
    try {
      const resp = await toggleLike(itinerary.id);
      setItinerary(prev =>
        prev
          ? {
              ...prev,
              isLiked: resp.liked,
              likeCount: prev.likeCount + (resp.liked ? 1 : -1),
            }
          : prev
      );
    } catch {
      toast.error('좋아요 처리에 실패했습니다.');
    } finally {
      setLiking(false);
    }
  };

  if (loading)
    return (
      <div className="itin-detail-page">
        <div className="itin-detail-skeleton">
          <div className="itin-skeleton-header" />
          <div className="itin-skeleton-tabs" />
          <div className="itin-skeleton-items">
            {[1, 2, 3].map(i => (
              <div key={i} className="itin-skeleton-item" />
            ))}
          </div>
        </div>
      </div>
    );

  if (!itinerary) return null;

  const days = Array.from({ length: itinerary.duration || 1 }, (_, i) => i + 1);
  const currentItems = dayItems(activeDay);

  return (
    <div className="itin-detail-page">
      {/* Header */}
      <motion.div
        className="itin-detail-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className="itin-back-btn" onClick={() => navigate('/itineraries')}>
          ← 목록
        </button>
        {itinerary.coverImage && (
          <div
            className="itin-detail-cover"
            style={{ backgroundImage: `url(${itinerary.coverImage})` }}
          />
        )}
        <div className="itin-detail-info">
          <h1>{itinerary.title}</h1>
          {itinerary.description && <p className="itin-detail-desc">{itinerary.description}</p>}
          <div className="itin-detail-meta">
            <span>
              📅 {itinerary.startDate} ~ {itinerary.endDate}
            </span>
            <span>🗓️ {itinerary.duration}일</span>
            <span>📋 {itinerary.itemCount}개 일정</span>
            <span>by {itinerary.owner.username}</span>
          </div>
          <div className="itin-detail-actions">
            <button
              className={`itin-like-btn ${itinerary.isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              {itinerary.isLiked ? '❤️' : '🤍'} {itinerary.likeCount}
            </button>
            <span className="itin-view-count">👁️ {itinerary.viewCount}</span>
            <span className="itin-copy-count">📋 {itinerary.copyCount}</span>
          </div>
        </div>
      </motion.div>

      {/* Day tabs */}
      <div className="itin-day-tabs">
        {days.map(d => (
          <button
            key={d}
            className={`itin-day-tab ${activeDay === d ? 'active' : ''}`}
            onClick={() => setActiveDay(d)}
          >
            Day {d}
            <span className="itin-day-count">{dayItems(d).length}</span>
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="itin-items-area">
        <div className="itin-items-header">
          <h2>Day {activeDay}</h2>
          {canEdit && (
            <button className="itin-btn-primary" onClick={() => setShowAddModal(true)}>
              + 추가
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {currentItems.length === 0 ? (
            <motion.div
              key="empty"
              className="itin-items-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p>
                {canEdit
                  ? 'Day ' + activeDay + '에 일정을 추가해보세요! ✈️'
                  : '아직 일정이 없습니다.'}
              </p>
              {canEdit && (
                <button className="itin-btn-primary" onClick={() => setShowAddModal(true)}>
                  첫 일정 추가
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="itin-items-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentItems.map((item, idx) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  isFirst={idx === 0}
                  isLast={idx === currentItems.length - 1}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDeleteItem(item)}
                  onMoveUp={() => handleMove(item, 'up')}
                  onMoveDown={() => handleMove(item, 'down')}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showAddModal && (
        <ItemModal
          dayNumber={activeDay}
          loading={saving}
          onSave={handleAddItem}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingItem && (
        <ItemModal
          dayNumber={editingItem.dayNumber}
          loading={saving}
          initial={{
            type: editingItem.type,
            title: editingItem.title,
            description: editingItem.description ?? '',
            notes: editingItem.notes ?? '',
            placeName: editingItem.placeName ?? '',
            placeAddress: editingItem.placeAddress ?? '',
            startTime: editingItem.startTime ?? '',
            endTime: editingItem.endTime ?? '',
            estimatedCost: editingItem.estimatedCost?.toString() ?? '',
            currency: editingItem.currency ?? 'KRW',
            bookingStatus: editingItem.bookingStatus ?? 'NOT_NEEDED',
            bookingUrl: editingItem.bookingUrl ?? '',
            imageUrl: editingItem.imageUrl ?? '',
          }}
          onSave={handleEditItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default ItineraryDetail;
