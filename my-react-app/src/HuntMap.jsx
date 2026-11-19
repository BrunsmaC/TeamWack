import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HuntMap.css';

function hasLocation(task) {
  const point = task.location;
  return point && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
    && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

export default function HuntMap({ tasks }) {
  const container = useRef(null);
  const map = useRef(null);
  const stops = useRef(null);
  const user = useRef(null);
  const accuracy = useRef(null);
  const lastPosition = useRef(null);
  const follow = useRef(true);
  const fitted = useRef('');
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState('Enable location to see where you are.');
  const [tileError, setTileError] = useState(false);
  const mapped = tasks.filter(hasLocation);

  useEffect(() => {
    const instance = L.map(container.current).setView([36.307, -82.362], 15);
    map.current = instance;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    tiles.on('tileerror', () => setTileError(true));
    stops.current = L.layerGroup().addTo(instance);
    instance.on('dragstart zoomstart', (event) => {
      if (event.originalEvent || event.type === 'dragstart') follow.current = false;
    });
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      user.current = null;
      accuracy.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    stops.current.clearLayers();
    const points = [];
    tasks.forEach((task, index) => {
      if (!hasLocation(task)) return;
      const point = [task.location.latitude, task.location.longitude];
      points.push(point);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${index + 1}. ${task.title}`;
      const detail = document.createElement('p');
      detail.textContent = `${task.location.name || task.title} · ${task.completed ? 'Complete' : 'Open'}`;
      popup.append(title, detail);
      const marker = L.marker(point, {
        title: `${index + 1}. ${task.title}${task.completed ? ' (complete)' : ''}`,
        alt: task.title,
        icon: L.divIcon({
          className: `hunt-stop ${task.completed ? 'hunt-stop-complete' : ''}`,
          html: `<span>${index + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 17],
        }),
      }).addTo(stops.current).bindPopup(popup);
      marker.getElement().setAttribute("aria-label", `${index + 1}. ${task.title}${task.completed ? " (complete)" : ""}`);
    });
    const key = JSON.stringify(points);
    if (points.length && key !== fitted.current) {
      instance.fitBounds(points, { padding: [42, 42], maxZoom: 16 });
      fitted.current = key;
    }
  }, [tasks]);

  useEffect(() => {
    if (!tracking) return;
    let active = true;
    const watch = navigator.geolocation.watchPosition(({ coords }) => {
      if (!active) return;
      const point = [coords.latitude, coords.longitude];
      lastPosition.current = point;
      const instance = map.current;
      if (!user.current) {
        user.current = L.circleMarker(point, {
          radius: 9, color: '#fff', weight: 3, fillColor: '#2463eb', fillOpacity: 1,
        }).addTo(instance).bindPopup('You are here');
        accuracy.current = L.circle(point, {
          radius: coords.accuracy, color: '#2463eb', weight: 1, fillOpacity: 0.1,
          interactive: false,
        }).addTo(instance);
      } else {
        user.current.setLatLng(point);
        accuracy.current.setLatLng(point).setRadius(coords.accuracy);
      }
      if (follow.current) instance.setView(point, Math.max(instance.getZoom(), 16));
      setStatus(`Location live · accuracy within ${Math.round(coords.accuracy)} m`);
    }, (error) => {
      if (!active) return;
      setStatus(error.code === 1
        ? 'Location access denied. Allow location in your browser settings, then try again.'
        : 'Location unavailable. Move outdoors or check your GPS, then try again.');
      if (error.code === 1) setTracking(false);
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    return () => {
      active = false;
      navigator.geolocation.clearWatch(watch);
      if (user.current) map.current?.removeLayer(user.current);
      if (accuracy.current) map.current?.removeLayer(accuracy.current);
      user.current = null;
      accuracy.current = null;
      lastPosition.current = null;
    };
  }, [tracking]);

  return (
    <section className="game-map hunt-map" aria-label="Hunt map">
      <div className="hunt-map-toolbar">
        <h2>Hunt map</h2>
        <div className="hunt-map-actions">
          <button type="button" onClick={() => {
            if (!window.isSecureContext || !navigator.geolocation) {
              setStatus('Location requires HTTPS or localhost and a browser with location support.');
              return;
            }
            follow.current = true;
            if (tracking && lastPosition.current) map.current.setView(lastPosition.current, 17);
            else {
              setStatus('Finding your location...');
              setTracking(true);
            }
          }}>{tracking ? 'Find me' : 'Enable location'}</button>
          {tracking && <button type="button" onClick={() => {
            setTracking(false);
            setStatus('Location tracking stopped.');
          }}>Stop tracking</button>}
          <button type="button" disabled={!mapped.length} onClick={() => {
            follow.current = false;
            map.current.fitBounds(mapped.map((task) => [task.location.latitude, task.location.longitude]),
              { padding: [42, 42], maxZoom: 16 });
          }}>Show tasks</button>
        </div>
      </div>
      <div ref={container} className="hunt-map-canvas" aria-label="Interactive street map" />
      <div className="hunt-map-caption">
        <p role="status">{status}</p>
        <p>Blue: you · Yellow: open task · Green: completed task</p>
        {mapped.length < tasks.length && <p>{tasks.length - mapped.length} task(s) have no valid location yet.</p>}
        {tileError && <p role="alert">Some map tiles could not load. Check your internet connection and reload.</p>}
      </div>
    </section>
  );
}
