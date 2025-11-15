package com.dash.dashtvplus.api.models

import com.google.gson.annotations.SerializedName

data class UserInfo(
    @SerializedName("username")
    val username: String,

    @SerializedName("password")
    val password: String,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("auth")
    val auth: Int = 0,

    @SerializedName("status")
    val status: String? = null,

    @SerializedName("exp_date")
    val expDate: String? = null,

    @SerializedName("is_trial")
    val isTrial: String? = null,

    @SerializedName("active_cons")
    val activeCons: String? = null,

    @SerializedName("created_at")
    val createdAt: String? = null,

    @SerializedName("max_connections")
    val maxConnections: String? = null,

    @SerializedName("allowed_output_formats")
    val allowedOutputFormats: List<String>? = null
)

data class ServerInfo(
    @SerializedName("url")
    val url: String,

    @SerializedName("port")
    val port: String,

    @SerializedName("https_port")
    val httpsPort: String? = null,

    @SerializedName("server_protocol")
    val serverProtocol: String,

    @SerializedName("rtmp_port")
    val rtmpPort: String? = null,

    @SerializedName("timezone")
    val timezone: String? = null,

    @SerializedName("timestamp_now")
    val timestampNow: Long = 0,

    @SerializedName("time_now")
    val timeNow: String? = null
)

data class AuthResponse(
    @SerializedName("user_info")
    val userInfo: UserInfo,

    @SerializedName("server_info")
    val serverInfo: ServerInfo
)
