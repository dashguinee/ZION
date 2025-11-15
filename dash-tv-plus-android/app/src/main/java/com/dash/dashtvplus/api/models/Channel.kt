package com.dash.dashtvplus.api.models

import com.google.gson.annotations.SerializedName

data class Channel(
    @SerializedName("num")
    val num: Int,

    @SerializedName("name")
    val name: String,

    @SerializedName("stream_type")
    val streamType: String,

    @SerializedName("stream_id")
    val streamId: String,

    @SerializedName("stream_icon")
    val streamIcon: String? = null,

    @SerializedName("epg_channel_id")
    val epgChannelId: String? = null,

    @SerializedName("added")
    val added: String? = null,

    @SerializedName("category_id")
    val categoryId: String? = null,

    @SerializedName("custom_sid")
    val customSid: String? = null,

    @SerializedName("tv_archive")
    val tvArchive: Int = 0,

    @SerializedName("direct_source")
    val directSource: String? = null,

    @SerializedName("tv_archive_duration")
    val tvArchiveDuration: Int = 0
)
