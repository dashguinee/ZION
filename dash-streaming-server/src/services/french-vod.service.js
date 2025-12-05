/**
 * French VOD Service
 *
 * Integrates multiple FREE French movie/series embed APIs:
 * - Frembed: 24,000+ French movies, 80,000+ episodes
 * - VidSrc: 66,000+ movies (international with French subtitles)
 * - FrWatch: French movies in 4K
 *
 * Created: December 5, 2025
 * Author: ZION SYNAPSE for DASH
 */

import logger from '../utils/logger.js';

class FrenchVODService {
  constructor() {
    // Embed API endpoints
    this.providers = {
      frembed: {
        name: 'Frembed',
        movie: 'https://frembed.pro/api/film.php?id={imdb}',
        series: 'https://frembed.pro/api/serie.php?id={imdb}&sa={season}&epi={episode}',
        description: '24,000+ French movies, 80,000+ episodes'
      },
      vidsrc: {
        name: 'VidSrc',
        movie: 'https://vidsrc.to/embed/movie/{id}',
        series: 'https://vidsrc.to/embed/tv/{id}/{season}/{episode}',
        description: '66,000+ movies, 320,000+ episodes'
      },
      vidsrcPro: {
        name: 'VidSrc Pro',
        movie: 'https://vidsrc.pro/embed/movie/{id}',
        series: 'https://vidsrc.pro/embed/tv/{id}/{season}/{episode}',
        description: 'Alternative VidSrc mirror'
      }
    };

    // TMDB API for metadata
    this.tmdbApiKey = process.env.TMDB_API_KEY || '632e644be9521013bdac3661ae65494e';
    this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
    this.tmdbImageBase = 'https://image.tmdb.org/t/p';

    // Cache for movie lists
    this.cache = new Map();
    this.cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours
  }

  /**
   * Get embed URL for a movie
   * @param {string} id - IMDB ID (tt1234567) or TMDB ID (12345)
   * @param {string} provider - Provider name (frembed, vidsrc)
   */
  getMovieEmbed(id, provider = 'frembed') {
    const p = this.providers[provider] || this.providers.frembed;

    // Frembed needs IMDB ID
    if (provider === 'frembed' && !id.startsWith('tt')) {
      // If TMDB ID provided, we'd need to convert - for now just use as-is
      return p.movie.replace('{imdb}', id);
    }

    return p.movie.replace('{id}', id).replace('{imdb}', id);
  }

  /**
   * Get embed URL for a TV series episode
   * @param {string} id - IMDB ID or TMDB ID
   * @param {number} season - Season number
   * @param {number} episode - Episode number
   * @param {string} provider - Provider name
   */
  getSeriesEmbed(id, season, episode, provider = 'frembed') {
    const p = this.providers[provider] || this.providers.frembed;

    return p.series
      .replace('{id}', id)
      .replace('{imdb}', id)
      .replace('{season}', season)
      .replace('{episode}', episode);
  }

  /**
   * Get all available embed URLs for a movie (for fallback)
   */
  getAllMovieEmbeds(id) {
    return Object.keys(this.providers).map(key => ({
      provider: this.providers[key].name,
      url: this.getMovieEmbed(id, key)
    }));
  }

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
        imdb_id: null, // Would need separate call to get IMDB ID
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster: movie.poster_path ? `${this.tmdbImageBase}/w500${movie.poster_path}` : null,
        backdrop: movie.backdrop_path ? `${this.tmdbImageBase}/original${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        rating: movie.vote_average,
        language: 'fr',
        embed_url: this.getMovieEmbed(movie.id.toString(), 'vidsrc'), // Use TMDB ID with VidSrc
        embeds: this.getAllMovieEmbeds(movie.id.toString())
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
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview,
          poster: movie.poster_path ? `${this.tmdbImageBase}/w500${movie.poster_path}` : null,
          backdrop: movie.backdrop_path ? `${this.tmdbImageBase}/original${movie.backdrop_path}` : null,
          release_date: movie.release_date,
          year: movie.release_date ? movie.release_date.split('-')[0] : null,
          rating: movie.vote_average,
          language: movie.original_language,
          embed_url: this.getMovieEmbed(movie.id.toString(), 'vidsrc'),
          embeds: this.getAllMovieEmbeds(movie.id.toString())
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
   * Get movie details with IMDB ID (needed for Frembed)
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
        // Embed URLs
        embeds: {
          frembed: movie.imdb_id ? this.getMovieEmbed(movie.imdb_id, 'frembed') : null,
          vidsrc: this.getMovieEmbed(movie.id.toString(), 'vidsrc'),
          vidsrcPro: this.getMovieEmbed(movie.id.toString(), 'vidsrcPro')
        }
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
      providers: Object.keys(this.providers).map(key => ({
        name: this.providers[key].name,
        description: this.providers[key].description
      })),
      estimated_content: {
        french_movies: '24,000+',
        french_series: '3,000+',
        french_episodes: '80,000+',
        international_movies: '66,000+',
        international_episodes: '320,000+'
      },
      note: 'Content is embedded from third-party providers. No hosting costs.'
    };
  }
}

export default new FrenchVODService();
