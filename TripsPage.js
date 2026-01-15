import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [editingTripId, setEditingTripId] = useState(null);

  const [formData, setFormData] = useState({
    userId: '123e4567-e89b-12d3-a456-426614174000',
    city: '',
    startDate: '',
    endDate: '',
    placeInput: ''
  });

  useEffect(() => {
    axios.get('http://localhost:5004/cities')
      .then(res => setCityOptions(res.data))
      .catch(err => console.error('City fetch error:', err));
  }, []);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await axios.get(`http://localhost:5003/trips/${formData.userId}`);
      setTrips(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceInputChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, placeInput: value }));

    if (value.length >= 2 && formData.city) {
      try {
        const res = await axios.get('http://localhost:5002/places', {
          params: { city: formData.city, query: value }
        });
        setSuggestions(res.data);
      } catch (err) {
        console.error('Suggestion fetch error:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (place) => {
    if (!selectedPlaces.includes(place)) {
      setSelectedPlaces(prev => [...prev, place]);
    }
    setFormData(prev => ({ ...prev, placeInput: '' }));
    setSuggestions([]);
  };

  const removePlace = (place) => {
    setSelectedPlaces(prev => prev.filter(p => p !== place));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      userId: formData.userId,
      city: formData.city,
      startDate: formData.startDate,
      endDate: formData.endDate,
      places: selectedPlaces
    };

    try {
      if (editingTripId) {
        await axios.put(`http://localhost:5003/trips/${editingTripId}`, payload);
        setEditingTripId(null);
      } else {
        await axios.post('http://localhost:5003/trips', payload);
      }

      fetchTrips();
      setSelectedPlaces([]);
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await axios.delete(`http://localhost:5003/trips/${tripId}`);
      fetchTrips();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleEditTrip = (trip) => {
    setEditingTripId(trip.id);
    setFormData({
      ...formData,
      city: trip.city,
      startDate: trip.start_date,
      endDate: trip.end_date,
      placeInput: ''
    });
    setSelectedPlaces(trip.places || []);
    setSuggestions([]);
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      city: '',
      startDate: '',
      endDate: '',
      placeInput: ''
    }));
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', background: '#f7f9fc' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>📅 Trip Planner</h2>

      <form onSubmit={handleSubmit} style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select name="city" value={formData.city} onChange={handleChange} required style={inputStyle}>
            <option value="">-- Şehir Seçin --</option>
            {cityOptions.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required style={inputStyle} />
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required style={inputStyle} />

          <input
            type="text"
            name="placeInput"
            value={formData.placeInput}
            onChange={handlePlaceInputChange}
            placeholder="📍 Mekan ara (örn. Gal...)"
            autoComplete="off"
            style={inputStyle}
          />

          {suggestions.length > 0 && (
            <ul style={{
              border: '1px solid #ddd', padding: '0.5rem', margin: 0,
              listStyle: 'none', background: '#fff', borderRadius: '6px'
            }}>
              {suggestions.map(s => (
                <li key={s} onClick={() => handleSuggestionClick(s)} style={{ cursor: 'pointer', padding: '4px 0' }}>
                  {s}
                </li>
              ))}
            </ul>
          )}

          <div>
            {selectedPlaces.map(place => (
              <span key={place} style={badgeStyle}>
                {place} <button type="button" onClick={() => removePlace(place)} style={badgeButtonStyle}>×</button>
              </span>
            ))}
          </div>

          <button type="submit" style={submitBtnStyle}>
            {editingTripId ? '✏️ Güncelle' : '➕ Oluştur'}
          </button>
        </div>
      </form>

      <h3 style={{ textAlign: 'center', margin: '2rem 0 1rem' }}>🧳 Planladığınız Geziler</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {trips.map(trip => (
          <div key={trip.id} style={cardStyle}>
            <h4>{trip.city}</h4>
            <p>{trip.start_date} → {trip.end_date}</p>
            <div>
              {(trip.places || []).map(place => (
                <span key={place} style={badgeStyle}>{place}</span>
              ))}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => handleEditTrip(trip)} style={editBtn}>✏️</button>
              <button onClick={() => handleDeleteTrip(trip.id)} style={deleteBtn}>❌</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #ccc'
};

const badgeStyle = {
  display: 'inline-block',
  background: '#e0f0ff',
  color: '#0077cc',
  padding: '4px 8px',
  borderRadius: '12px',
  marginRight: '6px',
  marginTop: '6px',
  fontSize: '12px'
};

const badgeButtonStyle = {
  marginLeft: '6px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#0077cc',
  fontSize: '14px'
};

const submitBtnStyle = {
  background: '#0077cc',
  color: '#fff',
  padding: '10px',
  fontSize: '14px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const cardStyle = {
  background: '#fff',
  padding: '1rem',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const editBtn = {
  marginRight: '10px',
  padding: '6px 12px',
  background: '#f0c040',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const deleteBtn = {
  padding: '6px 12px',
  background: '#ff4d4d',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'white'
};

export default TripsPage;
