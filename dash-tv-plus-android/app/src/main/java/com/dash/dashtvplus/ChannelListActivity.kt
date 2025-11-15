package com.dash.dashtvplus

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.dash.dashtvplus.api.XtreamService
import com.dash.dashtvplus.api.models.Category
import com.dash.dashtvplus.api.models.Channel
import com.dash.dashtvplus.databinding.ActivityChannelListBinding
import com.dash.dashtvplus.databinding.ItemCategoryBinding
import com.dash.dashtvplus.databinding.ItemChannelBinding
import com.dash.dashtvplus.utils.Constants
import com.dash.dashtvplus.utils.PrefsManager
import com.google.android.material.chip.Chip
import kotlinx.coroutines.launch

/**
 * Channel List Activity
 * Displays categories and channels with search and filtering
 */
class ChannelListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChannelListBinding
    private lateinit var prefsManager: PrefsManager
    private lateinit var xtreamService: XtreamService

    private var portalUrl: String = ""
    private var username: String = ""
    private var password: String = ""

    private val categories = mutableListOf<Category>()
    private val allChannels = mutableListOf<Channel>()
    private val filteredChannels = mutableListOf<Channel>()

    private lateinit var categoryAdapter: CategoryAdapter
    private lateinit var channelAdapter: ChannelAdapter

    private var selectedCategoryId: String = Constants.DEFAULT_CATEGORY_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChannelListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefsManager = PrefsManager(this)

        // Get credentials from intent
        portalUrl = intent.getStringExtra(Constants.EXTRA_PORTAL_URL) ?: ""
        username = intent.getStringExtra(Constants.EXTRA_USERNAME) ?: ""
        password = intent.getStringExtra(Constants.EXTRA_PASSWORD) ?: ""

        if (portalUrl.isEmpty() || username.isEmpty() || password.isEmpty()) {
            finish()
            return
        }

        xtreamService = XtreamService(portalUrl)

        setupUI()
        loadData()
    }

    /**
     * Setup UI components and listeners
     */
    private fun setupUI() {
        // Setup categories RecyclerView
        categoryAdapter = CategoryAdapter { category ->
            onCategorySelected(category)
        }
        binding.rvCategories.apply {
            layoutManager = LinearLayoutManager(this@ChannelListActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = categoryAdapter
        }

        // Setup channels RecyclerView
        channelAdapter = ChannelAdapter { channel ->
            onChannelSelected(channel)
        }
        binding.rvChannels.apply {
            layoutManager = GridLayoutManager(this@ChannelListActivity, 3)
            adapter = channelAdapter
        }

        // Swipe to refresh
        binding.swipeRefresh.setOnRefreshListener {
            loadData()
        }

        // Search functionality
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                filterChannels(s.toString())
            }
        })

        // Logout button
        binding.fabLogout.setOnClickListener {
            showLogoutDialog()
        }
    }

    /**
     * Load categories and channels
     */
    private fun loadData() {
        showLoading(true)
        binding.swipeRefresh.isRefreshing = false

        lifecycleScope.launch {
            try {
                // Load categories
                val categoriesResponse = xtreamService.getLiveCategories(username, password)
                if (categoriesResponse.isSuccessful && categoriesResponse.body() != null) {
                    categories.clear()

                    // Add "All Channels" category
                    categories.add(
                        Category(
                            categoryId = Constants.DEFAULT_CATEGORY_ID,
                            categoryName = Constants.DEFAULT_CATEGORY_NAME
                        )
                    )

                    categories.addAll(categoriesResponse.body()!!)
                    categoryAdapter.submitList(categories.toList())
                }

                // Load all channels
                val channelsResponse = xtreamService.getLiveStreams(username, password)
                if (channelsResponse.isSuccessful && channelsResponse.body() != null) {
                    allChannels.clear()
                    allChannels.addAll(channelsResponse.body()!!)

                    // Apply current filter
                    applyFilter()
                }

                showLoading(false)
                updateEmptyState()

            } catch (e: Exception) {
                showLoading(false)
                showError("Erreur de chargement: ${e.message}")
            }
        }
    }

    /**
     * Category selected
     */
    private fun onCategorySelected(category: Category) {
        selectedCategoryId = category.categoryId
        prefsManager.saveLastCategory(selectedCategoryId)
        applyFilter()
    }

    /**
     * Apply category filter
     */
    private fun applyFilter() {
        filteredChannels.clear()

        if (selectedCategoryId == Constants.DEFAULT_CATEGORY_ID) {
            // Show all channels
            filteredChannels.addAll(allChannels)
        } else {
            // Filter by category
            filteredChannels.addAll(
                allChannels.filter { it.categoryId == selectedCategoryId }
            )
        }

        channelAdapter.submitList(filteredChannels.toList())
        updateEmptyState()
    }

    /**
     * Filter channels by search query
     */
    private fun filterChannels(query: String) {
        if (query.isEmpty()) {
            applyFilter()
            return
        }

        val searchResults = filteredChannels.filter {
            it.name.contains(query, ignoreCase = true)
        }

        channelAdapter.submitList(searchResults)
        updateEmptyState()
    }

    /**
     * Channel selected - open player
     */
    private fun onChannelSelected(channel: Channel) {
        val intent = Intent(this, PlayerActivity::class.java).apply {
            putExtra(Constants.EXTRA_PORTAL_URL, portalUrl)
            putExtra(Constants.EXTRA_USERNAME, username)
            putExtra(Constants.EXTRA_PASSWORD, password)
            putExtra(Constants.EXTRA_CHANNEL, channel.streamId)
            putExtra("channel_name", channel.name)
            putStringArrayListExtra(
                Constants.EXTRA_CHANNEL_LIST,
                ArrayList(filteredChannels.map { it.streamId })
            )
            putExtra(
                Constants.EXTRA_CHANNEL_INDEX,
                filteredChannels.indexOfFirst { it.streamId == channel.streamId }
            )
        }
        startActivity(intent)
    }

    /**
     * Show/hide loading
     */
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
    }

    /**
     * Update empty state visibility
     */
    private fun updateEmptyState() {
        val isEmpty = channelAdapter.itemCount == 0
        binding.emptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
    }

    /**
     * Show error message
     */
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    /**
     * Show logout confirmation dialog
     */
    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.logout)
            .setMessage(R.string.logout_confirm)
            .setPositiveButton(R.string.yes) { _, _ ->
                prefsManager.clearAll()
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            .setNegativeButton(R.string.no, null)
            .show()
    }

    // ================== ADAPTERS ==================

    /**
     * Category Adapter
     */
    inner class CategoryAdapter(
        private val onCategoryClick: (Category) -> Unit
    ) : RecyclerView.Adapter<CategoryAdapter.ViewHolder>() {

        private var items = listOf<Category>()
        private var selectedPosition = 0

        fun submitList(list: List<Category>) {
            items = list
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemCategoryBinding.inflate(
                android.view.LayoutInflater.from(parent.context),
                parent,
                false
            )
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(items[position], position == selectedPosition)
        }

        override fun getItemCount() = items.size

        inner class ViewHolder(private val binding: ItemCategoryBinding) :
            RecyclerView.ViewHolder(binding.root) {

            fun bind(category: Category, isSelected: Boolean) {
                binding.chipCategory.apply {
                    text = category.categoryName
                    isChecked = isSelected

                    setOnClickListener {
                        val previousPosition = selectedPosition
                        selectedPosition = adapterPosition
                        notifyItemChanged(previousPosition)
                        notifyItemChanged(selectedPosition)
                        onCategoryClick(category)
                    }
                }
            }
        }
    }

    /**
     * Channel Adapter
     */
    inner class ChannelAdapter(
        private val onChannelClick: (Channel) -> Unit
    ) : RecyclerView.Adapter<ChannelAdapter.ViewHolder>() {

        private var items = listOf<Channel>()

        fun submitList(list: List<Channel>) {
            items = list
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemChannelBinding.inflate(
                android.view.LayoutInflater.from(parent.context),
                parent,
                false
            )
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(items[position])
        }

        override fun getItemCount() = items.size

        inner class ViewHolder(private val binding: ItemChannelBinding) :
            RecyclerView.ViewHolder(binding.root) {

            fun bind(channel: Channel) {
                binding.tvChannelName.text = channel.name

                // Load channel logo
                if (!channel.streamIcon.isNullOrEmpty()) {
                    Glide.with(binding.root.context)
                        .load(channel.streamIcon)
                        .placeholder(android.R.drawable.ic_menu_gallery)
                        .error(android.R.drawable.ic_menu_gallery)
                        .into(binding.ivChannelLogo)
                } else {
                    binding.ivChannelLogo.setImageResource(android.R.drawable.ic_menu_gallery)
                }

                binding.root.setOnClickListener {
                    onChannelClick(channel)
                }
            }
        }
    }
}
