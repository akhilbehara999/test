// Supabase integration for Lost and Found module

// Function to initialize Supabase client
function initLostFoundSupabase() {
    // Use the global Supabase client instead of creating a new one
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    
    // Fallback to initializing Supabase if global client is not available
    if (typeof window !== 'undefined' && window.supabase && window.SUPABASE_URL && window.SUPABASE_KEY) {
        window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        return window.supabaseClient;
    }
    
    console.error('Supabase client not available');
    return null;
}

// Function to get all lost and found items
async function getAllItems() {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('lost_found_items')
            .select('*')
            .order('reported_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching items:', error);
        return { success: false, error: error.message };
    }
}

// Function to get items with filters
async function getFilteredItems(filters = {}) {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        let query = supabase
            .from('lost_found_items')
            .select('*');

        // Apply filters
        if (filters.type && filters.type !== 'all') {
            query = query.eq('type', filters.type);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.searchTerm) {
            query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%`);
        }

        // Order by reported_at
        query = query.order('reported_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching filtered items:', error);
        return { success: false, error: error.message };
    }
}

// Function to add a new item
async function addItem(itemData) {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        const item = {
            name: itemData.name,
            description: itemData.description,
            type: itemData.type,
            category: itemData.category,
            date: itemData.date,
            location: itemData.location,
            contact: itemData.contact,
            image_url: itemData.image_url || null,
            reported_by: itemData.reported_by || (user ? user.email : 'anonymous'),
            user_id: user ? user.id : null,
            status: 'pending',
            is_flagged: false
        };

        const { data, error } = await supabase
            .from('lost_found_items')
            .insert([item])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error adding item:', error);
        return { success: false, error: error.message };
    }
}

// Function to update item status
async function updateItemStatus(itemId, status) {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('lost_found_items')
            .update({ status: status })
            .eq('id', itemId)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating item status:', error);
        return { success: false, error: error.message };
    }
}

// Function to flag/unflag an item
async function toggleItemFlag(itemId, isFlagged) {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('lost_found_items')
            .update({ is_flagged: isFlagged })
            .eq('id', itemId)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error toggling item flag:', error);
        return { success: false, error: error.message };
    }
}

// Function to delete an item
async function deleteItem(itemId) {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { error } = await supabase
            .from('lost_found_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting item:', error);
        return { success: false, error: error.message };
    }
}

// Function to get items reported by a specific user
async function getUserItems(userId) {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('lost_found_items')
            .select('*')
            .eq('user_id', userId)
            .order('reported_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching user items:', error);
        return { success: false, error: error.message };
    }
}

// Function to get analytics data
async function getAnalyticsData() {
    const supabase = initLostFoundSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get lost vs found counts using proper aggregation
        const { data: lostFoundData, error: lostFoundError } = await supabase
            .from('lost_found_items')
            .select('type');

        if (lostFoundError) throw lostFoundError;

        // Manually group the data
        const lostFoundCounts = {
            lost: lostFoundData.filter(item => item.type === 'lost').length,
            found: lostFoundData.filter(item => item.type === 'found').length
        };

        // Get category counts using proper aggregation
        const { data: categoryData, error: categoryError } = await supabase
            .from('lost_found_items')
            .select('category');

        if (categoryError) throw categoryError;

        // Manually group category data
        const categoryCounts = {};
        categoryData.forEach(item => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        });

        // Get items per day for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: trendData, error: trendError } = await supabase
            .from('lost_found_items')
            .select('reported_at')
            .gte('reported_at', sevenDaysAgo.toISOString())
            .order('reported_at', { ascending: true });

        if (trendError) throw trendError;

        // Group trend data by date
        const trendCounts = {};
        trendData.forEach(item => {
            const date = new Date(item.reported_at).toISOString().split('T')[0];
            trendCounts[date] = (trendCounts[date] || 0) + 1;
        });

        return {
            success: true,
            data: {
                lostFound: lostFoundCounts,
                categories: categoryCounts,
                trend: trendCounts
            }
        };
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        return { success: false, error: error.message };
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAllItems,
        getFilteredItems,
        addItem,
        updateItemStatus,
        toggleItemFlag,
        deleteItem,
        getUserItems,
        getAnalyticsData
    };
}