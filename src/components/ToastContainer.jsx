import { useChatContext } from '../context/ChatContext';

export default function ToastContainer() {
  const { toasts } = useChatContext();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast show align-items-center text-bg-${
            toast.type === 'join'
              ? 'success'
              : toast.type === 'leave'
                ? 'warning'
                : toast.type === 'mention'
                  ? 'info'
                  : 'primary'
          } border-0 mb-2 animate-fade-in`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">
              <i
                className={`bi ${
                  toast.type === 'join'
                    ? 'bi-person-plus-fill'
                    : toast.type === 'leave'
                      ? 'bi-person-dash-fill'
                      : toast.type === 'mention'
                        ? 'bi-at'
                        : 'bi-info-circle-fill'
                } me-2`}
              />
              {toast.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
