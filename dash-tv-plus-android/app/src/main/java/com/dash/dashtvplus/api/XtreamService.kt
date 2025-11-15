package com.dash.dashtvplus.api

import com.dash.dashtvplus.api.models.AuthResponse
import com.dash.dashtvplus.api.models.Category
import com.dash.dashtvplus.api.models.Channel
import com.dash.dashtvplus.api.models.EPGInfo
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class XtreamService(private val baseUrl: String) {

    private val api: XtreamAPI

    init {
        // Logging interceptor for debugging
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        // OkHttp client with timeouts optimized for African networks
        val client = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

        // Retrofit instance
        val retrofit = Retrofit.Builder()
            .baseUrl(ensureTrailingSlash(baseUrl))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(XtreamAPI::class.java)
    }

    /**
     * Ensure the base URL ends with a slash
     */
    private fun ensureTrailingSlash(url: String): String {
        return if (url.endsWith("/")) url else "$url/"
    }

    /**
     * Authenticate user
     */
    suspend fun authenticate(username: String, password: String): Response<AuthResponse> {
        return api.authenticate(username, password)
    }

    /**
     * Get live TV categories
     */
    suspend fun getLiveCategories(username: String, password: String): Response<List<Category>> {
        return api.getLiveCategories(username, password)
    }

    /**
     * Get all live streams
     */
    suspend fun getLiveStreams(username: String, password: String): Response<List<Channel>> {
        return api.getLiveStreams(username, password)
    }

    /**
     * Get live streams by category ID
     */
    suspend fun getLiveStreamsByCategory(
        username: String,
        password: String,
        categoryId: String
    ): Response<List<Channel>> {
        return api.getLiveStreamsByCategory(username, password, categoryId = categoryId)
    }

    /**
     * Get EPG info for a stream
     */
    suspend fun getEPG(
        username: String,
        password: String,
        streamId: String
    ): Response<Map<String, List<EPGInfo>>> {
        return api.getEPG(username, password, streamId = streamId)
    }

    /**
     * Build stream URL for live TV
     * Format: {portal_url}/live/{username}/{password}/{stream_id}.m3u8
     */
    fun buildLiveStreamUrl(username: String, password: String, streamId: String): String {
        val cleanBaseUrl = baseUrl.removeSuffix("/")
        return "$cleanBaseUrl/live/$username/$password/$streamId.m3u8"
    }

    /**
     * Build stream URL for VOD
     * Format: {portal_url}/movie/{username}/{password}/{stream_id}.{ext}
     */
    fun buildVODStreamUrl(
        username: String,
        password: String,
        streamId: String,
        extension: String = "mp4"
    ): String {
        val cleanBaseUrl = baseUrl.removeSuffix("/")
        return "$cleanBaseUrl/movie/$username/$password/$streamId.$extension"
    }

    /**
     * Build stream URL for series
     * Format: {portal_url}/series/{username}/{password}/{stream_id}.{ext}
     */
    fun buildSeriesStreamUrl(
        username: String,
        password: String,
        streamId: String,
        extension: String = "mp4"
    ): String {
        val cleanBaseUrl = baseUrl.removeSuffix("/")
        return "$cleanBaseUrl/series/$username/$password/$streamId.$extension"
    }

    companion object {
        /**
         * Validate portal URL format
         */
        fun isValidPortalUrl(url: String): Boolean {
            return url.matches(Regex("^https?://[\\w.-]+(:[0-9]+)?(/.*)?$"))
        }
    }
}
