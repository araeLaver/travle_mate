import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { authService } from '../services/authService';
import {
  getMyItineraries,
  getPublicItineraries,
  getPopularItineraries,
  createItinerary,
  Itinerary,
  CreateItineraryRequest,
  ItineraryVisibility,
} from '../services/itineraryService';
import './Itineraries.css';

type Tab = 'my' | 'popular' | 'public';

const ItineraryCard: React.FC<{ itinerary: Itinerary; onClick: () => void }> = ({
  itinerary,
  onClick,
}) => (
  <motion.div
    className="itinerary-card"
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    {itinerary.coverImage ? (
      <img src={itinerary.coverImage} alt={itinerary.title} className="itinerary-card-image" />
    ) : (
      <div className="itinerary-card-no-image">✈️</div>
    )}
    <div className="itinerary-card-body">
      <h3 title={itinerary.title}>{itinerary.title}</h3>
      <p className="itinerary-card-dates">
        {itinerary.startDate} ~ {itinerary.endDate}
      </p>
      <p className="itinerary-card-meta">
        {itinerary.duration}일 · {itinerary.itemCount}개 일정
      </p>
      <div className="itinerary-card-stats">
        <span>❤️ {itinerary.likeCount}</span>
        <span>👁️ {itinerary.viewCount}</span>
        <span>📋 {itinerary.copyCount}</span>
      </div>
      <div className="itinerary-card-owner">by {itinerary.owner.username}</div>
    </div>
  </motion.div>
);

const CreateItineraryModal: React.FC<{
  onClose: () => void;
  onCreate: (d: CreateItineraryRequest) => void;
  loading: boolean;
}> = ({ onClose, onCreate, loading }) => {
  const [form, setForm] = useState<CreateItineraryRequest>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    visibility: 'PRIVATE',
  });
  const set = (k: keyof CreateItineraryRequest, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="itin-modal-overlay" onClick={onClose}>
      <motion.div
        className="itin-modal-content"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2>새 여행 일정 만들기</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onCreate(form);
          }}
        >
          <div className="itin-form-group">
            <label>제목 *</label>
            <input
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="여행 제목을 입력하세요"
            />
          </div>
          <div className="itin-form-group">
            <label>설명</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="여행에 대해 설명해주세요"
            />
          </div>
          <div className="itin-form-row">
            <div className="itin-form-group">
              <label>시작일 *</label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div className="itin-form-group">
              <label>종료일 *</label>
              <input
                required
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>
          <div className="itin-form-group">
            <label>공개 설정</label>
            <select
              value={form.visibility}
              onChange={e => set('visibility', e.target.value as ItineraryVisibility)}
            >
              <option value="PRIVATE">비공개</option>
              <option value="LINK_ONLY">링크로 공유</option>
              <option value="FOLLOWERS">팔로워 공개</option>
              <option value="PUBLIC">전체 공개</option>
            </select>
          </div>
          <div className="itin-modal-actions">
            <button type="button" className="itin-btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="itin-btn-primary" disabled={loading}>
              {loading ? '생성 중...' : '일정 만들기'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Itineraries: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  const fetchItineraries = useCallback(
    async (tab: Tab, pageNum: number) => {
      if (tab === 'my' && !isAuthenticated) {
        setItineraries([]);
        setHasMore(false);
        return;
      }
      setLoading(true);
      try {
        const resp =
          tab === 'my'
            ? await getMyItineraries(pageNum)
            : tab === 'popular'
              ? await getPopularItineraries(pageNum)
              : await getPublicItineraries(pageNum);
        setItineraries(prev => (pageNum === 0 ? resp.content : [...prev, ...resp.content]));
        setHasMore(!resp.last);
      } catch {
        toast.error('일정을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, toast]
  );

  useEffect(() => {
    setPage(0);
    setItineraries([]);
    fetchItineraries(activeTab, 0);
  }, [activeTab]); // eslint-disable-line

  const handleCreate = async (data: CreateItineraryRequest) => {
    setCreating(true);
    try {
      const created = await createItinerary(data);
      setShowModal(false);
      toast.success('여행 일정이 생성되었습니다!');
      navigate(`/itineraries/${created.id}`);
    } catch {
      toast.error('일정 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'my' && !isAuthenticated)
      return (
        <div className="itin-empty-state">
          <p>로그인하면 내 여행 일정을 관리할 수 있어요.</p>
          <button className="itin-btn-primary" onClick={() => navigate('/login')}>
            로그인하기
          </button>
        </div>
      );
    if (loading && itineraries.length === 0)
      return (
        <div className="loading-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-skeleton" />
          ))}
        </div>
      );
    if (itineraries.length === 0)
      return (
        <div className="itin-empty-state">
          <p>
            {activeTab === 'my'
              ? '아직 여행 일정이 없어요. 첫 일정을 만들어보세요! 🗺️'
              : '공개된 일정이 없습니다.'}
          </p>
          {activeTab === 'my' && isAuthenticated && (
            <button className="itin-btn-primary" onClick={() => setShowModal(true)}>
              첫 일정 만들기
            </button>
          )}
        </div>
      );
    return (
      <>
        <motion.div
          className="itineraries-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {itineraries.map(it => (
            <motion.div
              key={it.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <ItineraryCard itinerary={it} onClick={() => navigate(`/itineraries/${it.id}`)} />
            </motion.div>
          ))}
        </motion.div>
        {hasMore && (
          <div className="itin-load-more">
            <button
              className="itin-btn-secondary"
              onClick={() => {
                const n = page + 1;
                setPage(n);
                fetchItineraries(activeTab, n);
              }}
              disabled={loading}
            >
              {loading ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="itineraries-page">
      <motion.div
        className="itineraries-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>✈️ 여행 일정</h1>
        {isAuthenticated && (
          <button className="itin-btn-primary itin-create-btn" onClick={() => setShowModal(true)}>
            + 새 일정
          </button>
        )}
      </motion.div>
      <div className="itineraries-tabs">
        {(['my', 'popular', 'public'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`itin-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'my' ? '내 일정' : tab === 'popular' ? '인기 일정' : '공개 일정'}
          </button>
        ))}
      </div>
      {renderContent()}
      {showModal && (
        <CreateItineraryModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          loading={creating}
        />
      )}
    </div>
  );
};

export default Itineraries;
