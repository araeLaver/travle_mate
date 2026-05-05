import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from './Toast';
import {
  updateItinerary,
  inviteCollaborator,
  getCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  Itinerary,
  Collaborator,
  CollaboratorRole,
  ItineraryVisibility,
} from '../services/itineraryService';
import './ItinerarySharePanel.css';

const VISIBILITY_OPTIONS: {
  value: ItineraryVisibility;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { value: 'PRIVATE', label: '비공개', desc: '나만 볼 수 있습니다', icon: '🔒' },
  { value: 'LINK_ONLY', label: '링크 공유', desc: '링크를 아는 사람만 볼 수 있습니다', icon: '🔗' },
  { value: 'FOLLOWERS', label: '팔로워 공개', desc: '팔로워에게 공개됩니다', icon: '👥' },
  { value: 'PUBLIC', label: '전체 공개', desc: '모든 사람이 볼 수 있습니다', icon: '🌐' },
];

const ROLE_LABELS: Record<CollaboratorRole, string> = {
  VIEWER: '뷰어',
  EDITOR: '편집자',
  ADMIN: '관리자',
};

interface Props {
  itinerary: Itinerary;
  onClose: () => void;
  onUpdated: (updated: Partial<Itinerary>) => void;
}

const ItinerarySharePanel: React.FC<Props> = ({ itinerary, onClose, onUpdated }) => {
  const toast = useToast();
  const [tab, setTab] = useState<'share' | 'collab'>('share');
  const [visibility, setVisibility] = useState<ItineraryVisibility>(itinerary.visibility);
  const [savingVis, setSavingVis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(itinerary.collaborators ?? []);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('VIEWER');
  const [inviting, setInviting] = useState(false);

  // Load collaborators when tab switches
  useEffect(() => {
    if (tab === 'collab') {
      setLoadingCollabs(true);
      getCollaborators(itinerary.id)
        .then(setCollaborators)
        .catch(() => toast.error('협업자 목록을 불러오지 못했습니다.'))
        .finally(() => setLoadingCollabs(false));
    }
  }, [tab, itinerary.id, toast]);

  const shareUrl = itinerary.shareCode
    ? `${window.location.origin}/itineraries/share/${itinerary.shareCode}`
    : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleVisibilitySave = async () => {
    setSavingVis(true);
    try {
      const updated = await updateItinerary(itinerary.id, { visibility });
      onUpdated({ visibility: updated.visibility, shareCode: updated.shareCode });
      toast.success('공개 설정이 변경되었습니다.');
    } catch {
      toast.error('설정 변경에 실패했습니다.');
    } finally {
      setSavingVis(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = Number(inviteUserId.trim());
    if (!uid) {
      toast.error('유효한 사용자 ID를 입력하세요.');
      return;
    }
    setInviting(true);
    try {
      await inviteCollaborator(itinerary.id, { userId: uid, role: inviteRole });
      toast.success('초대를 보냈습니다.');
      setInviteUserId('');
      // Refresh list
      const updated = await getCollaborators(itinerary.id);
      setCollaborators(updated);
    } catch {
      toast.error('초대에 실패했습니다.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (collab: Collaborator) => {
    if (!window.confirm(`${collab.username}님을 협업자에서 제거할까요?`)) return;
    try {
      await removeCollaborator(itinerary.id, collab.userId);
      setCollaborators(prev => prev.filter(c => c.id !== collab.id));
      toast.success('제거되었습니다.');
    } catch {
      toast.error('제거에 실패했습니다.');
    }
  };

  const handleRoleChange = async (collab: Collaborator, role: CollaboratorRole) => {
    try {
      await updateCollaboratorRole(itinerary.id, collab.userId, role);
      setCollaborators(prev => prev.map(c => (c.id === collab.id ? { ...c, role } : c)));
      toast.success('역할이 변경되었습니다.');
    } catch {
      toast.error('역할 변경에 실패했습니다.');
    }
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <motion.div
        className="share-panel"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="share-panel-header">
          <h2>공유 & 협업</h2>
          <button className="share-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="share-tabs">
          <button
            className={`share-tab ${tab === 'share' ? 'active' : ''}`}
            onClick={() => setTab('share')}
          >
            🔗 공유 설정
          </button>
          <button
            className={`share-tab ${tab === 'collab' ? 'active' : ''}`}
            onClick={() => setTab('collab')}
          >
            👥 협업자
          </button>
        </div>

        {/* ── Share tab ── */}
        {tab === 'share' && (
          <div className="share-content">
            {/* Share link */}
            <section className="share-section">
              <h3>공유 링크</h3>
              {shareUrl ? (
                <div className="share-link-row">
                  <input readOnly value={shareUrl} className="share-link-input" />
                  <button
                    className={`share-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
              ) : (
                <p className="share-no-link">공유 링크를 생성하려면 공개 설정을 변경하세요.</p>
              )}
            </section>

            {/* Visibility */}
            <section className="share-section">
              <h3>공개 설정</h3>
              <div className="share-vis-options">
                {VISIBILITY_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`share-vis-option ${visibility === opt.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={() => setVisibility(opt.value)}
                    />
                    <span className="share-vis-icon">{opt.icon}</span>
                    <span className="share-vis-text">
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </span>
                  </label>
                ))}
              </div>
              {visibility !== itinerary.visibility && (
                <button
                  className="share-save-btn"
                  onClick={handleVisibilitySave}
                  disabled={savingVis}
                >
                  {savingVis ? '저장 중...' : '변경 저장'}
                </button>
              )}
            </section>
          </div>
        )}

        {/* ── Collaborators tab ── */}
        {tab === 'collab' && (
          <div className="share-content">
            {/* Invite form */}
            {itinerary.isOwner && (
              <section className="share-section">
                <h3>협업자 초대</h3>
                <form className="invite-form" onSubmit={handleInvite}>
                  <input
                    type="number"
                    min="1"
                    placeholder="사용자 ID"
                    value={inviteUserId}
                    onChange={e => setInviteUserId(e.target.value)}
                    className="invite-input"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as CollaboratorRole)}
                    className="invite-role-select"
                  >
                    {(Object.keys(ROLE_LABELS) as CollaboratorRole[]).map(r => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="invite-submit-btn" disabled={inviting}>
                    {inviting ? '...' : '초대'}
                  </button>
                </form>
              </section>
            )}

            {/* Collaborator list */}
            <section className="share-section">
              <h3>협업자 목록</h3>
              {loadingCollabs ? (
                <div className="collab-loading">불러오는 중...</div>
              ) : collaborators.length === 0 ? (
                <p className="collab-empty">협업자가 없습니다.</p>
              ) : (
                <ul className="collab-list">
                  {collaborators.map(c => (
                    <li key={c.id} className="collab-item">
                      <img
                        src={
                          c.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username)}&background=6366f1&color=fff&size=36`
                        }
                        alt={c.username}
                        className="collab-avatar"
                      />
                      <div className="collab-info">
                        <span className="collab-name">{c.username}</span>
                        <span className={`collab-status ${c.status.toLowerCase()}`}>
                          {c.status === 'PENDING'
                            ? '초대 대기중'
                            : c.status === 'ACCEPTED'
                              ? '수락됨'
                              : '거절됨'}
                        </span>
                      </div>
                      <div className="collab-actions">
                        {itinerary.isOwner ? (
                          <>
                            <select
                              value={c.role}
                              onChange={e =>
                                handleRoleChange(c, e.target.value as CollaboratorRole)
                              }
                              className="collab-role-select"
                            >
                              {(Object.keys(ROLE_LABELS) as CollaboratorRole[]).map(r => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                            <button className="collab-remove-btn" onClick={() => handleRemove(c)}>
                              제거
                            </button>
                          </>
                        ) : (
                          <span className="collab-role-label">{ROLE_LABELS[c.role]}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ItinerarySharePanel;
