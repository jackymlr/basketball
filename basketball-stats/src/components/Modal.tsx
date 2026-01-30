import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      {/* 移动端：全高布局；桌面端：居中卡片 */}
      <div
        className="flex items-end sm:items-center justify-center min-h-[100dvh] min-h-screen px-0 sm:px-4 pt-[var(--sat,0)] pb-4 sm:pb-20 text-center sm:p-0"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* 背景遮罩：可点击关闭 */}
        <div
          className="fixed inset-0 bg-gray-500/75 transition-opacity touch-none sm:touch-auto"
          onClick={onClose}
          aria-hidden
        />

        {/* 模态框：430 小屏接近全屏、可滚动 */}
        <div className="relative w-full max-h-[90dvh] sm:max-h-[85vh] max-w-lg sm:my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-t-2xl sm:rounded-2xl flex flex-col">
          <div className="flex items-center justify-between shrink-0 p-4 sm:p-6 pb-2 sm:pb-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 pr-2">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="关闭"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 flex-1 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
