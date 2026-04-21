import { useEffect, useRef, useState } from 'react';
import './styles/TimePickerModal.css';

const ITEM_HEIGHT = 40;
const PICKER_HEIGHT = 180;
const SPACER_HEIGHT = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

function parseTime(timeStr) {
  if (!timeStr) return [12, 0, 'AM'];

  const raw = String(timeStr).trim();
  const m12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    const hour12 = Math.max(1, Math.min(12, parseInt(m12[1], 10)));
    const mins = Math.max(0, Math.min(59, parseInt(m12[2], 10)));
    const ap = m12[3].toUpperCase();
    return [hour12, mins, ap];
  }

  const m24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h24 = Math.max(0, Math.min(23, parseInt(m24[1], 10)));
    const mins = Math.max(0, Math.min(59, parseInt(m24[2], 10)));
    const ap = h24 >= 12 ? 'PM' : 'AM';
    if (h24 === 0) h24 = 12;
    else if (h24 > 12) h24 -= 12;
    return [h24, mins, ap];
  }

  return [12, 0, 'AM'];
}

function formatTime(h, m, ap) {
  // Convert 12-hour to 24-hour for storage
  let hour24 = h;
  if (ap === 'PM' && h !== 12) hour24 = h + 12;
  if (ap === 'AM' && h === 12) hour24 = 0;
  
  return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getRenderedItemHeight(listRef) {
  const item = listRef?.current?.querySelector('.picker-item');
  const h = item?.getBoundingClientRect?.().height;
  return h && h > 0 ? h : ITEM_HEIGHT;
}

export default function TimePickerModal({ value, onChange, onClose }) {
  const hourListRef = useRef(null);
  const minListRef = useRef(null);
  const isAutoScrollingRef = useRef(false);

  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [ampm, setAmpm] = useState('AM');

  // Initialize from value
  useEffect(() => {
    const [h, m, ap] = parseTime(value);
    setHours(h);
    setMinutes(m);
    setAmpm(ap);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      isAutoScrollingRef.current = true;
      scrollSelectedItem(hourListRef, hours - 1);
      scrollSelectedItem(minListRef, minutes);
      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  function scrollSelectedItem(ref, index) {
    if (ref.current) {
      const selectedNode = ref.current.children[index + 1];
      if (selectedNode && typeof selectedNode.scrollIntoView === 'function') {
        selectedNode.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }

  const handleHourScroll = () => {
    if (isAutoScrollingRef.current) return;
    if (hourListRef.current) {
      const scrollTop = hourListRef.current.scrollTop;
      const itemHeight = getRenderedItemHeight(hourListRef);
      const centerIndex = Math.round(scrollTop / itemHeight);
      const selected = Math.max(0, Math.min(centerIndex, 11));
      const newH = selected + 1;
      setHours(newH);
      onChange(formatTime(newH, minutes, ampm));
    }
  };

  const handleHourSelect = (newH) => {
    setHours(newH);
    onChange(formatTime(newH, minutes, ampm));
    isAutoScrollingRef.current = true;
    scrollSelectedItem(hourListRef, newH - 1);
    requestAnimationFrame(() => {
      isAutoScrollingRef.current = false;
    });
  };

  const handleMinScroll = () => {
    if (isAutoScrollingRef.current) return;
    if (minListRef.current) {
      const scrollTop = minListRef.current.scrollTop;
      const itemHeight = getRenderedItemHeight(minListRef);
      const centerIndex = Math.round(scrollTop / itemHeight);
      const selected = Math.max(0, Math.min(centerIndex, 59));
      setMinutes(selected);
      onChange(formatTime(hours, selected, ampm));
    }
  };

  const handleMinuteSelect = (newMinute) => {
    setMinutes(newMinute);
    onChange(formatTime(hours, newMinute, ampm));
    isAutoScrollingRef.current = true;
    scrollSelectedItem(minListRef, newMinute);
    requestAnimationFrame(() => {
      isAutoScrollingRef.current = false;
    });
  };

  const handleAmpmScroll = () => {
    return;
  };

  return (
    <div className="time-picker-overlay" onClick={onClose}>
      <div className="time-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="time-picker-header">
          <div>
            <h3>Select Time</h3>
            <p className="time-picker-subtitle">Pick the exact hour, minute, and period.</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="time-picker-display">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')} {ampm}
        </div>

        <div className="time-picker-body">
          {/* Hour Picker */}
          <div className="picker-column">
            <div className="picker-label">Hour</div>
            <div 
              className="picker-scroll"
              ref={hourListRef}
              onScroll={handleHourScroll}
            >
              <div className="picker-spacer" aria-hidden="true" style={{ height: `${SPACER_HEIGHT}px` }} />
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className={"picker-item " + (hours === i + 1 ? 'is-selected' : '')}
                  onClick={() => handleHourSelect(i + 1)}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
              ))}
              <div className="picker-spacer" aria-hidden="true" style={{ height: `${SPACER_HEIGHT}px` }} />
            </div>
          </div>

          {/* Minute Picker */}
          <div className="picker-column">
            <div className="picker-label">Minute</div>
            <div 
              className="picker-scroll"
              ref={minListRef}
              onScroll={handleMinScroll}
            >
              <div className="picker-spacer" aria-hidden="true" style={{ height: `${SPACER_HEIGHT}px` }} />
              {Array.from({ length: 60 }, (_, i) => (
                <div
                  key={i}
                  className={"picker-item " + (minutes === i ? 'is-selected' : '')}
                  onClick={() => handleMinuteSelect(i)}
                >
                  {String(i).padStart(2, '0')}
                </div>
              ))}
              <div className="picker-spacer" aria-hidden="true" style={{ height: `${SPACER_HEIGHT}px` }} />
            </div>
          </div>

          {/* AM/PM Picker */}
          <div className="picker-column">
            <div className="picker-label">Period</div>
            <div className="period-toggle" role="group" aria-label="Select AM or PM">
              {['AM', 'PM'].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={"period-btn " + (ampm === period ? 'is-selected' : '')}
                  aria-pressed={ampm === period}
                  onClick={() => {
                    setAmpm(period);
                    onChange(formatTime(hours, minutes, period));
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="time-picker-footer">
          <button className="btn-s" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
