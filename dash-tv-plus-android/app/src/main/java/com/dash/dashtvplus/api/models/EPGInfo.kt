package com.dash.dashtvplus.api.models

import com.google.gson.annotations.SerializedName

data class EPGInfo(
    @SerializedName("id")
    val id: String,

    @SerializedName("epg_id")
    val epgId: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("lang")
    val lang: String? = null,

    @SerializedName("start")
    val start: String,

    @SerializedName("end")
    val end: String,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("channel_id")
    val channelId: String
)
