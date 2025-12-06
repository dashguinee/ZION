/**
 * French VOD Service
 *
 * Uses TMDB for metadata + our stream extractor for direct HLS/MP4 streams
 * NO EMBED IFRAMES - they redirect to sketchy ad sites (1xbet, etc.)
 *
 * Working providers: Vixsrc (HLS), MP4Hydra (MP4)
 *
 * Created: December 5, 2025
 * Updated: December 6, 2025 - Removed sketchy embed providers
 * Author: ZION SYNAPSE for DASH
 */

import logger from '../utils/logger.js';

class FrenchVODService {
  constructor() {
    // NOTE: We no longer use embed iframes (frembed, vidsrc.to, etc.)
    // They redirect to 1xbet and other sketchy sites
    // All streams now go through our backend stream extractor
    // which extracts direct HLS/MP4 URLs from Vixsrc and MP4Hydra

    // TMDB API for metadata
    this.tmdbApiKey = process.env.TMDB_API_KEY || '632e644be9521013bdac3661ae65494e';
    this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
    this.tmdbImageBase = 'https://image.tmdb.org/t/p';

    // Cache for movie lists
    this.cache = new Map();
    this.cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours
  }

  // DEPRECATED: Embed methods removed - we use direct stream extraction now
  // See /api/french-vod/stream/movie/:id for direct HLS/MP4 streams

  /**
   * Fetch popular French movies from TMDB
   * Returns movies with French as original language
   */
  async getFrenchMovies(page = 1) {
    const cacheKey = `french_movies_${page}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // Use discover endpoint to find French-language movies
      const url = `${this.tmdbBaseUrl}/discover/movie?` + new URLSearchParams({
        api_key: this.tmdbApiKey,
        with_original_language: 'fr',
        sort_by: 'popularity.desc',
        page: page.toString(),
        'vote_count.gte': '100'
      });

      const response = await fetch(url);
      const data = await response.json();

      const movies = data.results.map(movie => ({
        id: movie.id,
        tmdb_id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster: movie.poster_path ? `${this.tmdbImageBase}/w500${movie.poster_path}` : null,
        backdrop: movie.backdrop_path ? `${this.tmdbImageBase}/original${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        rating: movie.vote_average,
        language: 'fr',
        // Use stream extractor endpoint - NO sketchy embed iframes
        stream_url: `/api/french-vod/stream/movie/${movie.id}`
      }));

      const result = {
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
        movies
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      logger.error('Error fetching French movies:', error.message);
      return { page: 1, total_pages: 0, total_results: 0, movies: [] };
    }
  }

  /**
   * Fetch popular French TV series from TMDB
   */
  async getFrenchSeries(page = 1) {
    const cacheKey = `french_series_${page}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const url = `${this.tmdbBaseUrl}/discover/tv?` + new URLSearchParams({
        api_key: this.tmdbApiKey,
        with_original_language: 'fr',
        sort_by: 'popularity.desc',
        page: page.toString(),
        'vote_count.gte': '50'
      });

      const response = await fetch(url);
      const data = await response.json();

      const series = data.results.map(show => ({
        id: show.id,
        title: show.name,
        original_title: show.original_name,
        overview: show.overview,
        poster: show.poster_path ? `${this.tmdbImageBase}/w500${show.poster_path}` : null,
        backdrop: show.backdrop_path ? `${this.tmdbImageBase}/original${show.backdrop_path}` : null,
        first_air_date: show.first_air_date,
        year: show.first_air_date ? show.first_air_date.split('-')[0] : null,
        rating: show.vote_average,
        language: 'fr'
      }));

      const result = {
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
        series
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      logger.error('Error fetching French series:', error.message);
      return { page: 1, total_pages: 0, total_results: 0, series: [] };
    }
  }

  /**
   * Search French movies
   */
  async searchFrenchMovies(query, page = 1) {
    try {
      const url = `${this.tmdbBaseUrl}/search/movie?` + new URLSearchParams({
        api_key: this.tmdbApiKey,
        query,
        page: page.toString(),
        language: 'fr-FR'
      });

      const response = await fetch(url);
      const data = await response.json();

      const movies = data.results
        .filter(movie => movie.original_language === 'fr' || movie.poster_path)
        .map(movie => ({
          id: movie.id,
          tmdb_id: movie.id,
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview,
          poster: movie.poster_path ? `${this.tmdbImageBase}/w500${movie.poster_path}` : null,
          backdrop: movie.backdrop_path ? `${this.tmdbImageBase}/original${movie.backdrop_path}` : null,
          release_date: movie.release_date,
          year: movie.release_date ? movie.release_date.split('-')[0] : null,
          rating: movie.vote_average,
          language: movie.original_language,
          // Use stream extractor endpoint - NO sketchy embed iframes
          stream_url: `/api/french-vod/stream/movie/${movie.id}`
        }));

      return {
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
        movies
      };

    } catch (error) {
      logger.error('Error searching French movies:', error.message);
      return { page: 1, total_pages: 0, total_results: 0, movies: [] };
    }
  }

  /**
   * Get movie details from TMDB
   */
  async getMovieDetails(tmdbId) {
    try {
      const url = `${this.tmdbBaseUrl}/movie/${tmdbId}?` + new URLSearchParams({
        api_key: this.tmdbApiKey,
        append_to_response: 'external_ids,credits,videos'
      });

      const response = await fetch(url);
      const movie = await response.json();

      return {
        id: movie.id,
        tmdb_id: movie.id,
        imdb_id: movie.imdb_id,
        title: movie.title,
        original_title: movie.original_title,
        tagline: movie.tagline,
        overview: movie.overview,
        poster: movie.poster_path ? `${this.tmdbImageBase}/w500${movie.poster_path}` : null,
        backdrop: movie.backdrop_path ? `${this.tmdbImageBase}/original${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        runtime: movie.runtime,
        rating: movie.vote_average,
        vote_count: movie.vote_count,
        genres: movie.genres?.map(g => g.name) || [],
        language: movie.original_language,
        budget: movie.budget,
        revenue: movie.revenue,
        // Cast
        cast: movie.credits?.cast?.slice(0, 10).map(c => ({
          name: c.name,
          character: c.character,
          profile: c.profile_path ? `${this.tmdbImageBase}/w185${c.profile_path}` : null
        })) || [],
        // Director
        director: movie.credits?.crew?.find(c => c.job === 'Director')?.name,
        // Trailer
        trailer: movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key,
        // Use stream extractor endpoint - NO sketchy embed iframes
        stream_url: `/api/french-vod/stream/movie/${movie.id}`,
        all_streams_url: `/api/french-vod/streams/all/movie/${movie.id}`
      };

    } catch (error) {
      logger.error('Error fetching movie details:', error.message);
      return null;
    }
  }

  /**
   * Get curated French movie collections
   */
  async getCuratedFrenchMovies() {
    // Popular French films that we know work well
    const curatedIds = [
      // Classic French Cinema
      194, // Amélie
      77, // Memento (not French but popular)
      914, // The Professional (Léon)
      11216, // Cinema Paradiso
      205, // Hotel Rwanda
      // Recent French hits
      346698, // Barbie (dubbed in French available)
      569094, // Spider-Man: Across the Spider-Verse
      385687, // Fast X
      // French Originals
      1895, // Les Choristes
      223702, // Intouchables
      10835, // La Haine
      578, // Jeux d'enfants
      194, // Le Fabuleux Destin d'Amélie Poulain
      18998, // Taken
      1422, // The Departed
    ];

    const movies = [];
    for (const id of curatedIds.slice(0, 10)) { // Limit for speed
      const details = await this.getMovieDetails(id);
      if (details) {
        movies.push(details);
      }
    }

    return movies;
  }

  /**
   * Get stats about available content
   */
  getProviderStats() {
    return {
      working_providers: [
        { name: 'Vixsrc', format: 'HLS', description: 'Direct HLS extraction - 1080p' },
        { name: 'MP4Hydra', format: 'MP4', description: 'Direct MP4 downloads - 2 servers' }
      ],
      metadata_source: 'TMDB',
      estimated_content: {
        french_movies: 'Unlimited (TMDB)',
        live_channels: '169 French channels',
        providers_working: 2,
        providers_blocked: 8
      },
      note: 'Direct HLS/MP4 streams - no sketchy embed iframes (no 1xbet redirects)'
    };
  }
}

export default new FrenchVODService();
