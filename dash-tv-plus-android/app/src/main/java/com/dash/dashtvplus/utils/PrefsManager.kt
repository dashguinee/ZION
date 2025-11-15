package com.dash.dashtvplus.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class PrefsManager(context: Context) {

    private val sharedPreferences: SharedPreferences

    init {
        // Use EncryptedSharedPreferences for secure storage of credentials
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            sharedPreferences = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback to regular SharedPreferences if encryption fails
            sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    companion object {
        private const val PREFS_NAME = "dash_tv_plus_prefs"
        private const val KEY_PORTAL_URL = "portal_url"
        private const val KEY_USERNAME = "username"
        private const val KEY_PASSWORD = "password"
        private const val KEY_REMEMBER_ME = "remember_me"
        private const val KEY_LAST_CATEGORY = "last_category"
        private const val KEY_USER_STATUS = "user_status"
        private const val KEY_EXP_DATE = "exp_date"
    }

    /**
     * Save login credentials
     */
    fun saveCredentials(portalUrl: String, username: String, password: String, rememberMe: Boolean) {
        sharedPreferences.edit().apply {
            putString(KEY_PORTAL_URL, portalUrl)
            putString(KEY_USERNAME, username)
            putString(KEY_PASSWORD, password)
            putBoolean(KEY_REMEMBER_ME, rememberMe)
            apply()
        }
    }

    /**
     * Get portal URL
     */
    fun getPortalUrl(): String? {
        return sharedPreferences.getString(KEY_PORTAL_URL, null)
    }

    /**
     * Get username
     */
    fun getUsername(): String? {
        return sharedPreferences.getString(KEY_USERNAME, null)
    }

    /**
     * Get password
     */
    fun getPassword(): String? {
        return sharedPreferences.getString(KEY_PASSWORD, null)
    }

    /**
     * Check if remember me is enabled
     */
    fun isRememberMeEnabled(): Boolean {
        return sharedPreferences.getBoolean(KEY_REMEMBER_ME, false)
    }

    /**
     * Check if user is logged in (credentials saved and remember me enabled)
     */
    fun isLoggedIn(): Boolean {
        return isRememberMeEnabled() &&
                !getPortalUrl().isNullOrEmpty() &&
                !getUsername().isNullOrEmpty() &&
                !getPassword().isNullOrEmpty()
    }

    /**
     * Save user account status
     */
    fun saveUserStatus(status: String, expDate: String?) {
        sharedPreferences.edit().apply {
            putString(KEY_USER_STATUS, status)
            putString(KEY_EXP_DATE, expDate)
            apply()
        }
    }

    /**
     * Get user status
     */
    fun getUserStatus(): String? {
        return sharedPreferences.getString(KEY_USER_STATUS, null)
    }

    /**
     * Get expiration date
     */
    fun getExpDate(): String? {
        return sharedPreferences.getString(KEY_EXP_DATE, null)
    }

    /**
     * Save last selected category
     */
    fun saveLastCategory(categoryId: String) {
        sharedPreferences.edit().putString(KEY_LAST_CATEGORY, categoryId).apply()
    }

    /**
     * Get last selected category
     */
    fun getLastCategory(): String? {
        return sharedPreferences.getString(KEY_LAST_CATEGORY, null)
    }

    /**
     * Clear all saved data (logout)
     */
    fun clearAll() {
        sharedPreferences.edit().clear().apply()
    }

    /**
     * Clear only credentials
     */
    fun clearCredentials() {
        sharedPreferences.edit().apply {
            remove(KEY_PORTAL_URL)
            remove(KEY_USERNAME)
            remove(KEY_PASSWORD)
            remove(KEY_REMEMBER_ME)
            apply()
        }
    }
}
