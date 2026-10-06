
import { useEffect, useRef, useState } from "react";
import notificationService from "../../services/notificationService";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const response =
        await notificationService.getUnreadCount();

      setUnreadCount(response?.data?.count || 0);
    } catch (error) {
      console.error(
        "Failed to load notification count:",
        error,
      );
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response =
        await notificationService.getNotifications({
          page: 1,
          limit: 10,
        });

      setNotifications(response?.data || []);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const nextOpen = !open;

    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.isRead) {
      return;
    }

    try {
      await notificationService.markAsRead(
        notification._id,
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setUnreadCount((current) =>
        Math.max(current - 1, 0),
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error,
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!unreadCount) {
      return;
    }

    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error,
      );
    }
  };

  useEffect(() => {
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  return (
    <div
    className="notification-bell position-relative"
    ref={dropdownRef}
    >
        <button
        type="button"
        className="btn notification-bell-button position-relative d-flex align-items-center justify-content-center"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
        >
        <i className="bi bi-bell fs-5" />

        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
        className="notification-dropdown shadow"
        role="menu"
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <strong>Notifications</strong>

            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none"
              onClick={handleMarkAllAsRead}
              disabled={!unreadCount}
            >
              Mark all as read
            </button>
          </div>

          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div className="text-center py-4">
                <div
                  className="spinner-border spinner-border-sm"
                  role="status"
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="bi bi-bell-slash fs-3 d-block mb-2" />
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`dropdown-item text-wrap py-3 ${
                    !notification.isRead
                      ? "bg-light"
                      : ""
                  }`}
                  onClick={() =>
                    handleMarkAsRead(notification)
                  }
                >
                  <div className="d-flex gap-2">
                    <div>
                      {!notification.isRead && (
                        <span className="text-primary">
                          ●
                        </span>
                      )}
                    </div>

                    <div className="flex-grow-1">
                      <div className="fw-semibold">
                        {notification.title}
                      </div>

                      <div className="small text-muted">
                        {notification.message}
                      </div>
                      {/* <div className="small text-muted">
                        <a href={notification.link} target="_blank" rel="noopener noreferrer">
                          {notification.link}
                        </a>
                      </div> */}
                      <div className="small text-secondary mt-1">
                        {new Date(
                          notification.createdAt,
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
