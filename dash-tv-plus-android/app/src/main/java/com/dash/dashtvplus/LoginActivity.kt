package com.dash.dashtvplus

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.dash.dashtvplus.api.XtreamService
import com.dash.dashtvplus.databinding.ActivityLoginBinding
import com.dash.dashtvplus.utils.Constants
import com.dash.dashtvplus.utils.PrefsManager
import kotlinx.coroutines.launch

/**
 * Login Activity
 * Handles user authentication with Xtream Codes API
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var prefsManager: PrefsManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefsManager = PrefsManager(this)

        setupUI()
        loadSavedCredentials()
    }

    /**
     * Setup UI listeners
     */
    private fun setupUI() {
        binding.btnLogin.setOnClickListener {
            validateAndLogin()
        }
    }

    /**
     * Load saved credentials if remember me is enabled
     */
    private fun loadSavedCredentials() {
        if (prefsManager.isRememberMeEnabled()) {
            binding.etPortalUrl.setText(prefsManager.getPortalUrl())
            binding.etUsername.setText(prefsManager.getUsername())
            binding.etPassword.setText(prefsManager.getPassword())
            binding.cbRememberMe.isChecked = true
        }
    }

    /**
     * Validate inputs and perform login
     */
    private fun validateAndLogin() {
        // Reset errors
        binding.tilPortalUrl.error = null
        binding.tilUsername.error = null
        binding.tilPassword.error = null

        // Get input values
        val portalUrl = binding.etPortalUrl.text.toString().trim()
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val rememberMe = binding.cbRememberMe.isChecked

        // Validate portal URL
        if (portalUrl.isEmpty()) {
            binding.tilPortalUrl.error = getString(R.string.error_empty_portal)
            binding.etPortalUrl.requestFocus()
            return
        }

        if (!XtreamService.isValidPortalUrl(portalUrl)) {
            binding.tilPortalUrl.error = getString(R.string.error_invalid_portal)
            binding.etPortalUrl.requestFocus()
            return
        }

        // Validate username
        if (username.isEmpty()) {
            binding.tilUsername.error = getString(R.string.error_empty_username)
            binding.etUsername.requestFocus()
            return
        }

        // Validate password
        if (password.isEmpty()) {
            binding.tilPassword.error = getString(R.string.error_empty_password)
            binding.etPassword.requestFocus()
            return
        }

        // Perform login
        performLogin(portalUrl, username, password, rememberMe)
    }

    /**
     * Perform login with Xtream API
     */
    private fun performLogin(
        portalUrl: String,
        username: String,
        password: String,
        rememberMe: Boolean
    ) {
        // Show loading
        showLoading(true)

        lifecycleScope.launch {
            try {
                // Create Xtream service
                val xtreamService = XtreamService(portalUrl)

                // Authenticate
                val response = xtreamService.authenticate(username, password)

                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!

                    // Check if authentication was successful
                    if (authResponse.userInfo.auth == 1) {
                        // Save credentials if remember me is checked
                        if (rememberMe) {
                            prefsManager.saveCredentials(portalUrl, username, password, true)
                        }

                        // Save user status
                        prefsManager.saveUserStatus(
                            authResponse.userInfo.status ?: Constants.STATUS_ACTIVE,
                            authResponse.userInfo.expDate
                        )

                        // Navigate to channel list
                        navigateToChannelList(portalUrl, username, password)
                    } else {
                        // Authentication failed
                        showLoading(false)
                        showError(getString(R.string.error_login_failed))
                    }
                } else {
                    // Request failed
                    showLoading(false)
                    showError(getString(R.string.error_login_failed))
                }
            } catch (e: Exception) {
                // Network or other error
                showLoading(false)
                val errorMessage = when {
                    e.message?.contains("Unable to resolve host") == true -> getString(R.string.error_network)
                    e.message?.contains("timeout") == true -> getString(R.string.error_network)
                    else -> getString(R.string.error_server)
                }
                showError(errorMessage)
            }
        }
    }

    /**
     * Navigate to channel list activity
     */
    private fun navigateToChannelList(portalUrl: String, username: String, password: String) {
        val intent = Intent(this, ChannelListActivity::class.java).apply {
            putExtra(Constants.EXTRA_PORTAL_URL, portalUrl)
            putExtra(Constants.EXTRA_USERNAME, username)
            putExtra(Constants.EXTRA_PASSWORD, password)
        }
        startActivity(intent)
        finish()
    }

    /**
     * Show/hide loading indicator
     */
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !show
        binding.etPortalUrl.isEnabled = !show
        binding.etUsername.isEnabled = !show
        binding.etPassword.isEnabled = !show
        binding.cbRememberMe.isEnabled = !show
    }

    /**
     * Show error message
     */
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
