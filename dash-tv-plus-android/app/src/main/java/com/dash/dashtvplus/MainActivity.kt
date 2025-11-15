package com.dash.dashtvplus

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.dash.dashtvplus.utils.Constants
import com.dash.dashtvplus.utils.PrefsManager

/**
 * Main Activity - Splash Screen
 * Checks if user is logged in and routes to appropriate screen
 */
class MainActivity : AppCompatActivity() {

    private lateinit var prefsManager: PrefsManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // No layout needed - using theme with gradient background
        prefsManager = PrefsManager(this)

        // Delay splash screen and check login status
        Handler(Looper.getMainLooper()).postDelayed({
            checkLoginAndNavigate()
        }, Constants.SPLASH_DELAY)
    }

    /**
     * Check if user is logged in and navigate accordingly
     */
    private fun checkLoginAndNavigate() {
        if (prefsManager.isLoggedIn()) {
            // User is logged in, go to channel list
            navigateToChannelList()
        } else {
            // User not logged in, go to login screen
            navigateToLogin()
        }
    }

    /**
     * Navigate to login screen
     */
    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }

    /**
     * Navigate to channel list
     */
    private fun navigateToChannelList() {
        val intent = Intent(this, ChannelListActivity::class.java).apply {
            putExtra(Constants.EXTRA_PORTAL_URL, prefsManager.getPortalUrl())
            putExtra(Constants.EXTRA_USERNAME, prefsManager.getUsername())
            putExtra(Constants.EXTRA_PASSWORD, prefsManager.getPassword())
        }
        startActivity(intent)
        finish()
    }
}
