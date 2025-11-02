import { useState, useEffect } from 'react';
import './style.css';

interface Track {
  name: string;
  url: string;
  image: string;
}

interface MusicInfo {
  tracks: Track[];
}

export default function RouteMusicSpotifyApp() {
  // Estados para gerenciar dados da aplicação
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [weather, setWeather] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [music, setMusic] = useState<MusicInfo | null>(null);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMoreMusic, setLoadingMoreMusic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musicOffset, setMusicOffset] = useState(0);
  const [spotifyToken, setSpotifyToken] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Importa as credenciais das variáveis de ambiente (está no .env também!)
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
  const apiKey = import.meta.env.VITE_API_KEY;

  // APIs utilizadas (Geoapify, OpenWeatherMap, Spotify)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

   // Formata a duração em minutos para um formato legível (horas e minutos)
   // minutes - Duração total em minutos
   // String formatada (ex: "2h 30min", "45 min", "3h")

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }

   // Promise com o token de acesso
   // Error se não conseguir gerar o token
   
  async function getSpotifyToken(): Promise<string> {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Codifica as credenciais em Base64 para autenticação básica
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('Erro ao gerar token Spotify');
    return data.access_token;
  }
   // geojson - Objeto GeoJSON contendo os dados da rota
   // apiKey - Chave da API Geoapify
   // Promise com a URL da imagem em formato Data URL (base64)
  
  async function getMapPreview(geojson: any, apiKey: any): Promise<string> {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // Personaliza a linha da rota
    geojson.properties.linecolor = '#2563eb';
    geojson.properties.linewidth = '6';

    // parâmetros do mapa estático
    const params = {
      style: "osm-bright",
      width: 900,
      height: 450,
      scaleFactor: 2,
      geojson: geojson,

      // Adiciona marcadores nos pontos de origem e destino
      markers: geojson.properties.waypoints.map((waypoint: any) => ({
        lat: waypoint.location[1],
        lon: waypoint.location[0],
        color: "#ef4444",
        size: "medium",
        type: "awesome"
      }))
    };

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(params),
      redirect: "follow"
    };

    try {
      const response = await fetch(
        `https://maps.geoapify.com/v1/staticmap?apiKey=${apiKey}`,
        requestOptions
      );
      const blob = await response.blob();
      
      // Converte o blob da imagem para Data URL para exibição
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
          resolve(this.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching map preview:', error);
      throw error;
    }
  }

   //Usa paginação através do parâmetro offset para buscar os próximos resultados
  async function loadMoreMusic() {
    if (!origin || !destination || !spotifyToken) return;
    setLoadingMoreMusic(true);

    try {
      const newOffset = musicOffset + 6;
      const query = encodeURIComponent(`${origin} to ${destination} travel music`);
      const musicRes = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=6&offset=${newOffset}`,
        { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
      );
      const musicJson = await musicRes.json();
      const newTracks = musicJson.tracks?.items || [];
      
      // Adiciona as novas músicas à lista existente (ao invés de substituir)
      setMusic(prevMusic => ({
        tracks: [
          ...(prevMusic?.tracks || []),
          ...newTracks.map((t: any) => ({
            name: t.name,
            url: t.external_urls.spotify,
            image: t.album.images[0]?.url || ''
          }))
        ]
      }));
      
      // Atualiza o offset para a próxima requisição
      setMusicOffset(newOffset);
    } catch (err: any) {
      console.error('Error loading more music:', err);
    } finally {
      setLoadingMoreMusic(false);
    }
  }

  async function handleSearch() {
    // Valida se os campos foram preenchidos
    if (!origin || !destination) return;
    
    setLoading(true);
    setError(null);
    setMusicOffset(0);

    try {
      // Geocodificação da ORIGEM
      // Converte o nome da cidade em coordenadas geográficas (lat, lon)
      const geoOriginRes = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(origin)}&apiKey=${apiKey}`
      );
      const geoOriginData = await geoOriginRes.json();
      const originCoords = geoOriginData.features?.[0]?.geometry?.coordinates;

      // Geocodificação do DESTINO
      const geoDestRes = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(destination)}&apiKey=${apiKey}`
      );
      const geoDestData = await geoDestRes.json();
      const destCoords = geoDestData.features?.[0]?.geometry?.coordinates;

      // Valida se ambas as localizações foram encontradas
      if (!originCoords || !destCoords) {
        throw new Error('Não foi possível localizar uma das cidades');
      }

      // Permite ao usuário abrir a rota diretamente no Google Maps
      const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      setGoogleMapsUrl(googleMapsDirectionsUrl);

      // Calcula a ROTA usando a API de Routing (latitude,longitude  |  latitude,longitude)
      const routingUrl = `https://api.geoapify.com/v1/routing?waypoints=${originCoords[1]},${originCoords[0]}|${destCoords[1]},${destCoords[0]}&mode=drive&details=instruction&apiKey=${apiKey}`;
      
      const routingRes = await fetch(routingUrl);
      const geojson = await routingRes.json();

      // Extrai a primeira rota encontrada
      const routeFeature = geojson.features?.[0];
      if (!routeFeature) throw new Error(`Rota não encontrada. Ou Não existe uma rota terrestre entre ${origin} e ${destination}.`);

      // Informações da rota (distância e tempo)
      const routeProps = routeFeature.properties;
      setDistance(routeProps.distance / 1000);
      setDuration(routeProps.time / 60);

      // Gera o preview visual do mapa
      const mapDataUrl = await getMapPreview(routeFeature, apiKey);
      setMapUrl(mapDataUrl);

      /// Busca informações CLIMÁTICAS do destino
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${destCoords[1]}&lon=${destCoords[0]}&units=metric&lang=pt_br&appid=949a743e5889d609233761952713a188`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.weather?.[0]?.description || 'Sem descrição');
      setTemperature(weatherData.main?.temp ? `${Math.round(weatherData.main.temp)}°C` : '0°C');

      // Busca MÚSICAS recomendadas no Spotify
      const token = await getSpotifyToken();
      setSpotifyToken(token);
      
      // Depois busca músicas relacionadas à viagem
      const query = encodeURIComponent(`${origin} to ${destination} travel music`);
      const musicRes = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=6&offset=0`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const musicJson = await musicRes.json();
      const tracks = musicJson.tracks?.items || [];
      
      // Formata os dados das músicas para o formato esperado
      setMusic({
        tracks: tracks.map((t: any) => ({
          name: t.name,
          url: t.external_urls.spotify,
          image: t.album.images[0]?.url || ''
        }))
      });

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <div className="app-wrapper">
        
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">Planejador de Viagem</h1>
          <p className="app-subtitle">
            Encontre sua rota, veja o clima e explore novas músicas para sua viagem!!
            <br />
            <b> Utilize "Cidade, País" para melhor precisão na hora da busca. </b>
          </p>
        </header>

        {/* Search Box */}
        <div className="search-card">
          <div className="search-form">
            <input
              type="text"
              placeholder='Origem (Cidade, País)'
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder='Destino (Cidade, País)'
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="search-input"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="search-button"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {(distance || weather) && (
          <div className="stats-grid">
            {distance && duration && (
              <div className="stat-card">
                <div className="stat-icon distance">🚗</div>
                <div className="stat-content">
                  <div className="stat-label">Distância e Tempo</div>
                  <div className="stat-value">{distance.toFixed(0)} km</div>
                  <div className="stat-extra">{formatDuration(duration)}</div>
                </div>
              </div>
            )}

            {weather && (
              <div className="stat-card">
                <div className="stat-icon weather">☀️</div>
                <div className="stat-content">
                  <div className="stat-label">Clima no Destino</div>
                  <div className="stat-value">{temperature}</div>
                  <div className="stat-extra">{weather}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        {mapUrl && googleMapsUrl && (
          <section className="map-section">
            <h2 className="section-title">Mapa da Rota Da Sua Viagem</h2>
            <a 
              href={googleMapsUrl} 
              target='_blank' 
              rel='noreferrer'
              className="map-link"
            >
              <img
                src={mapUrl}
                alt='Mapa da rota'
                className="map-image"
              />
            </a>
          </section>
        )}

        {/* Music */}
        {music && music.tracks.length > 0 && (
          <section className="music-section">
            <h2 className="section-title">Playlists Recomendadas</h2>
            <div className="music-grid">
              {music.tracks.map((t, i) => (
                <article key={i} className="music-card">
                  {t.image && (
                    <img
                      src={t.image}
                      alt={t.name}
                      className="music-cover"
                    />
                  )}
                  <div className="music-info">
                    <p className="music-title">{t.name}</p>
                    <a
                      href={t.url}
                      target='_blank'
                      rel='noreferrer'
                      className="music-link"
                    >
                      Ouvir
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="load-more-container">
              <button
                onClick={loadMoreMusic}
                disabled={loadingMoreMusic}
                className="load-more-button"
              >
                {loadingMoreMusic ? 'Carregando...' : 'Carregar Mais Músicas'}
              </button>
            </div>
          </section>
        )}

        {/* Scroll Top */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="scroll-top-button"
            aria-label="Voltar ao topo"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
