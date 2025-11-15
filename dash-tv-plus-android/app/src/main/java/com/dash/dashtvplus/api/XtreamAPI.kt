package com.dash.dashtvplus.api

import com.dash.dashtvplus.api.models.AuthResponse
import com.dash.dashtvplus.api.models.Category
import com.dash.dashtvplus.api.models.Channel
import com.dash.dashtvplus.api.models.EPGInfo
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface XtreamAPI {

    /**
     * Authenticate user and get account info
     */
    @GET("player_api.php")
    suspend fun authenticate(
        @Query("username") username: String,
        @Query("password") password: String
    ): Response<AuthResponse>

    /**
     * Get all live TV categories
     */
    @GET("player_api.php")
    suspend fun getLiveCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_categories"
    ): Response<List<Category>>

    /**
     * Get all live streams (channels)
     */
    @GET("player_api.php")
    suspend fun getLiveStreams(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_streams"
    ): Response<List<Channel>>

    /**
     * Get live streams by category
     */
    @GET("player_api.php")
    suspend fun getLiveStreamsByCategory(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_streams",
        @Query("category_id") categoryId: String
    ): Response<List<Channel>>

    /**
     * Get EPG for a specific stream
     */
    @GET("player_api.php")
    suspend fun getEPG(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_simple_data_table",
        @Query("stream_id") streamId: String
    ): Response<Map<String, List<EPGInfo>>>

    /**
     * Get VOD categories
     */
    @GET("player_api.php")
    suspend fun getVODCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_categories"
    ): Response<List<Category>>

    /**
     * Get VOD streams
     */
    @GET("player_api.php")
    suspend fun getVODStreams(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_streams"
    ): Response<List<Channel>>

    /**
     * Get series categories
     */
    @GET("player_api.php")
    suspend fun getSeriesCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series_categories"
    ): Response<List<Category>>
}
