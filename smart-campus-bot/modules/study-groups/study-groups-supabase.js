// Supabase integration for Study Groups module

// Function to initialize Supabase client
function initStudyGroupsSupabase() {
    // First try to use the global supabase client if already initialized
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    
    // If Supabase library is available and we have credentials, initialize it
    if (typeof window !== 'undefined' && window.supabase && 
        window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
            // Store in window for reuse
            window.supabaseClient = client;
            return client;
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return null;
        }
    }
    
    console.error('Supabase client not available');
    return null;
}

// Function to get all study groups
async function getAllGroups() {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('study_groups')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Handle authentication errors specifically
            if (error.message.includes('JWT expired') || error.message.includes('Invalid JWT') || error.message.includes('Unauthorized')) {
                return { success: false, error: 'Authentication required. Please log in again.' };
            }
            throw error;
        }
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching groups:', error);
        return { success: false, error: error.message || 'Failed to fetch groups' };
    }
}

// Function to create a new study group
async function createGroup(groupData) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        console.log('Creating new group:', groupData);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Create the group
        const group = {
            name: groupData.name,
            description: groupData.description,
            created_by: user ? user.id : null,
            created_by_email: user ? user.email : 'anonymous',
            status: 'active'
        };

        const { data: groupResult, error: groupError } = await supabase
            .from('study_groups')
            .insert([group])
            .select();

        if (groupError) throw groupError;
        
        console.log('Group created successfully:', groupResult);
        
        // Get the group ID
        const groupId = groupResult[0].id;
        
        // Automatically add the creator as a member with admin role
        if (user) {
            console.log(`Adding creator as member to group ${groupId}`);
            
            const memberData = {
                user_id: user.id,
                group_id: groupId,
                role: 'admin'  // Creator is automatically an admin
            };
            
            // Try to add user information if columns exist
            try {
                memberData.user_email = user.email;
                memberData.user_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User';
            } catch (e) {
                // If columns don't exist, we'll just insert the basic data
                console.warn('User info columns not available, inserting basic membership data');
            }
            
            const { error: memberError } = await supabase
                .from('group_members')
                .insert([memberData]);
                
            if (memberError) {
                console.error('Error adding creator as member:', memberError);
                // This is not a critical error, so we continue
            } else {
                console.log('Creator added as member successfully');
            }
            
            // Add a small delay to ensure database consistency
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update member count to reflect the creator being added
            // This ensures the count is accurate even if there were any discrepancies
            console.log(`Calling updateGroupMemberCount for newly created group ${groupId}`);
            await updateGroupMemberCount(groupId);
        }

        // Return the group
        const { data: updatedGroupData, error: fetchError } = await supabase
            .from('study_groups')
            .select('*')
            .eq('id', groupId)
            .maybeSingle();
            
        if (fetchError) throw fetchError;

        console.log('Returning updated group data:', updatedGroupData);
        return { success: true, data: updatedGroupData };
    } catch (error) {
        console.error('Error creating group:', error);
        return { success: false, error: error.message };
    }
}

// Function to update group status (archive/activate)
async function updateGroupStatus(groupId, status) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('study_groups')
            .update({ status: status })
            .eq('id', groupId)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating group status:', error);
        return { success: false, error: error.message };
    }
}

// Function to delete a group
async function deleteGroup(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // First, delete all group requests associated with this group
        const { error: requestsError } = await supabase
            .from('group_requests')
            .delete()
            .eq('group_id', groupId);

        if (requestsError) throw requestsError;

        // Then, delete all group messages associated with this group
        const { error: messagesError } = await supabase
            .from('group_messages')
            .delete()
            .eq('group_id', groupId);

        if (messagesError) throw messagesError;

        // Then, delete all group members associated with this group
        const { error: membersError } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId);

        if (membersError) throw membersError;

        // Finally, delete the group itself
        const { error: groupError } = await supabase
            .from('study_groups')
            .delete()
            .eq('id', groupId);

        if (groupError) throw groupError;
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting group:', error);
        return { success: false, error: error.message };
    }
}

// Function to get groups created by a specific user
async function getUserGroups(userId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('study_groups')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching user groups:', error);
        return { success: false, error: error.message };
    }
}

// Function to get group members
async function getGroupMembers(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // First try to get the member data with user information (new columns)
        let query = supabase
            .from('group_members')
            .select(`
                user_id,
                role,
                joined_at
            `)
            .eq('group_id', groupId);

        // Try to include the new columns if they exist
        try {
            query = supabase
                .from('group_members')
                .select(`
                    user_id,
                    role,
                    joined_at,
                    user_email,
                    user_name
                `)
                .eq('group_id', groupId);
        } catch (e) {
            // If the columns don't exist, fall back to the basic query
            console.warn('User info columns not available, using basic query');
        }

        const { data: membersData, error: membersError } = await query;

        if (membersError) {
            console.error('Error fetching group members data:', membersError);
            // Handle authentication errors specifically
            if (membersError.message.includes('JWT expired') || membersError.message.includes('Invalid JWT') || membersError.message.includes('Unauthorized')) {
                return { success: false, error: 'Authentication required. Please log in again.' };
            }
            throw membersError;
        }
        
        // Process the member data to create user objects
        const membersWithUserData = membersData.map(member => {
            // Check if we have the new columns
            if (member.user_email !== undefined && member.user_name !== undefined) {
                // Use the new columns
                return {
                    ...member,
                    user: { 
                        id: member.user_id, 
                        email: member.user_email || 'User ID: ' + member.user_id,
                        name: member.user_name || member.user_email?.split('@')[0] || 'User ID: ' + member.user_id.substring(0, 8) + '...'
                    }
                };
            } else {
                // Fall back to the old approach
                return {
                    ...member,
                    user: { 
                        id: member.user_id, 
                        email: 'User ID: ' + member.user_id,
                        name: 'User ID: ' + member.user_id.substring(0, 8) + '...'
                    }
                };
            }
        });
        
        return { success: true, data: membersWithUserData };
    } catch (error) {
        console.error('Error fetching group members:', error);
        return { success: false, error: error.message || 'Failed to fetch group members' };
    }
}

// Function to join a group
async function joinGroup(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        console.log(`Attempting to join group ${groupId}`);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Check if user is the group creator (they are automatically a member)
        const { data: groupData, error: groupError } = await supabase
            .from('study_groups')
            .select('created_by')
            .eq('id', groupId)
            .maybeSingle();

        if (groupError) throw groupError;
        
        if (groupData && groupData.created_by === user.id) {
            return { success: false, error: 'You are already the creator of this group.' };
        }

        // Check if already a member
        const { data: existingMembership, error: checkError } = await supabase
            .from('group_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingMembership) {
            return { success: false, error: 'Already a member of this group' };
        }

        // Add user as a member with 'member' role by default
        // Also store user information if the columns exist
        const memberData = {
            user_id: user.id,
            group_id: groupId,
            role: 'member'
        };

        // Try to add user information (will work if columns exist)
        try {
            memberData.user_email = user.email;
            memberData.user_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User';
        } catch (e) {
            // If columns don't exist, we'll just insert the basic data
            console.warn('User info columns not available, inserting basic membership data');
        }

        const { data, error } = await supabase
            .from('group_members')
            .insert([memberData])
            .select();

        if (error) throw error;
        
        console.log(`Successfully added user to group ${groupId}`);
        
        // Add a longer delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update member count in study_groups table
        console.log(`Calling updateGroupMemberCount for group ${groupId}`);
        await updateGroupMemberCount(groupId);
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error joining group:', error);
        return { success: false, error: error.message };
    }
}

// Function to leave a group
async function leaveGroup(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        console.log(`Attempting to leave group ${groupId}`);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Check if user is the group creator (can't leave their own group)
        const { data: groupData, error: groupError } = await supabase
            .from('study_groups')
            .select('created_by')
            .eq('id', groupId)
            .maybeSingle();

        if (groupError) throw groupError;
        
        if (groupData && groupData.created_by === user.id) {
            return { success: false, error: 'Group creators cannot leave their own group. Please delete the group instead.' };
        }
        
        // Check if user is actually a member
        const { data: membershipData, error: membershipError } = await supabase
            .from('group_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .maybeSingle();

        if (membershipError) throw membershipError;
        
        if (!membershipData) {
            return { success: false, error: 'You are not a member of this group.' };
        }

        // Remove user from group
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('user_id', user.id)
            .eq('group_id', groupId);

        if (error) throw error;
        
        console.log(`Successfully removed user from group ${groupId}`);
        
        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update member count in study_groups table
        console.log(`Calling updateGroupMemberCount for group ${groupId}`);
        await updateGroupMemberCount(groupId);
        
        return { success: true };
    } catch (error) {
        console.error('Error leaving group:', error);
        return { success: false, error: error.message };
    }
}

// Function to check if user is a member of a group
async function isGroupMember(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // First check if user is the group creator (they are automatically a member)
        const { data: groupData, error: groupError } = await supabase
            .from('study_groups')
            .select('created_by')
            .eq('id', groupId)
            .maybeSingle();

        if (groupError) throw groupError;
        
        // If user is the creator, they are automatically a member
        if (groupData && groupData.created_by === user.id) {
            return { success: true, data: true };
        }
        
        // Otherwise check if they are explicitly a member
        const { data, error } = await supabase
            .from('group_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data: !!data };
    } catch (error) {
        console.error('Error checking group membership:', error);
        return { success: false, error: error.message };
    }
}

// Function to get user's role in a group
async function getUserRoleInGroup(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // First check if user is the group creator (they are automatically an admin)
        const { data: groupData, error: groupError } = await supabase
            .from('study_groups')
            .select('created_by')
            .eq('id', groupId)
            .maybeSingle();

        if (groupError) throw groupError;
        
        // If user is the creator, they are automatically an admin
        if (groupData && groupData.created_by === user.id) {
            return { success: true, data: 'admin' };
        }
        
        // Otherwise check their explicit role
        const { data, error } = await supabase
            .from('group_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .maybeSingle();

        if (error) throw error;
        
        if (!data) {
            return { success: true, data: null }; // Not a member
        }
        
        return { success: true, data: data.role };
    } catch (error) {
        console.error('Error fetching user role:', error);
        return { success: false, error: error.message };
    }
}

// Function to promote a member to admin
async function promoteMember(groupId, userId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('group_members')
            .update({ role: 'admin' })
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .select();

        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error promoting member:', error);
        return { success: false, error: error.message };
    }
}

// Function to demote an admin to member
async function demoteAdmin(groupId, userId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { data, error } = await supabase
            .from('group_members')
            .update({ role: 'member' })
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .select();

        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error demoting admin:', error);
        return { success: false, error: error.message };
    }
}

// Function to remove a member from a group
async function removeMember(groupId, userId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;
        
        // Update member count in study_groups table
        await updateGroupMemberCount(groupId);
        
        return { success: true };
    } catch (error) {
        console.error('Error removing member:', error);
        return { success: false, error: error.message };
    }
}

// Function to update member count in study_groups table
async function updateGroupMemberCount(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return;

    try {
        console.log(`Updating member count for group ${groupId}`);
        
        // Retry mechanism to ensure we get the correct count
        let memberCount = 0;
        let retryCount = 0;
        const maxRetries = 5;
        let previousCount = -1;
        
        while (retryCount <= maxRetries) {
            // Add a delay to ensure database consistency
            if (retryCount > 0) {
                console.log(`Retry ${retryCount} for counting members in group ${groupId}`);
                await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
            }
            
            // Count current members in group_members table
            const { data: members, error: membersError } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', groupId);

            if (membersError) throw membersError;

            memberCount = members ? members.length : 0;
            console.log(`Counted ${memberCount} members for group ${groupId}`);
            
            // Check if the count has stabilized (same as previous attempt)
            if (memberCount === previousCount) {
                console.log(`Member count stabilized at ${memberCount}`);
                break;
            }
            
            // Update previous count for next iteration
            previousCount = memberCount;
            
            // If we've tried enough times, break anyway
            if (retryCount === maxRetries) {
                console.log(`Max retries reached, using count of ${memberCount}`);
                break;
            }
            
            retryCount++;
        }
        
        // Update the member count in study_groups table
        const { error: updateError } = await supabase
            .from('study_groups')
            .update({ member_count: memberCount })
            .eq('id', groupId);
            
        if (updateError) throw updateError;
        
        console.log(`Successfully updated member count for group ${groupId} to ${memberCount}`);
    } catch (error) {
        console.error('Error updating group member count:', error);
    }
}

// Function to send a message to a group
async function sendGroupMessage(groupId, message) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Check if user is a member of the group
        const isMemberResult = await isGroupMember(groupId);
        if (!isMemberResult.success || !isMemberResult.data) {
            return { success: false, error: 'You must be a member of this group to send messages' };
        }

        // Create the message
        const messageData = {
            group_id: groupId,
            user_id: user.id,
            message: message,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User'
        };

        const { data, error } = await supabase
            .from('group_messages')
            .insert([messageData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error sending group message:', error);
        return { success: false, error: error.message };
    }
}

// Function to get group messages
async function getGroupMessages(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Check if user is a member of the group
        const isMemberResult = await isGroupMember(groupId);
        if (!isMemberResult.success || !isMemberResult.data) {
            return { success: false, error: 'You must be a member of this group to view messages' };
        }

        const { data, error } = await supabase
            .from('group_messages')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching group messages:', error);
        return { success: false, error: error.message };
    }
}

// Function to update group settings (name, description, visibility)
async function updateGroupSettings(groupId, settings) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Check if user is admin of the group
        const userRoleResult = await getUserRoleInGroup(groupId);
        if (!userRoleResult.success || userRoleResult.data !== 'admin') {
            return { success: false, error: 'Only group admins can update group settings' };
        }

        // Prepare update data
        const updateData = {};
        if (settings.name !== undefined) updateData.name = settings.name;
        if (settings.description !== undefined) updateData.description = settings.description;
        if (settings.visibility !== undefined) updateData.visibility = settings.visibility;

        const { data, error } = await supabase
            .from('study_groups')
            .update(updateData)
            .eq('id', groupId)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating group settings:', error);
        return { success: false, error: error.message };
    }
}

// Function to request to join a private group
async function requestToJoinGroup(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Check if already a member
        const { data: existingMembership, error: checkError } = await supabase
            .from('group_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingMembership) {
            return { success: false, error: 'Already a member of this group' };
        }

        // Check if already requested
        const { data: existingRequest, error: requestCheckError } = await supabase
            .from('group_requests')
            .select('id')
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .eq('status', 'pending')
            .maybeSingle();

        if (requestCheckError) throw requestCheckError;
        
        if (existingRequest) {
            return { success: false, error: 'Already requested to join this group' };
        }

        // Get group visibility
        const { data: groupData, error: groupError } = await supabase
            .from('study_groups')
            .select('visibility, created_by')
            .eq('id', groupId)
            .maybeSingle();

        if (groupError) throw groupError;

        // If it's a public group, join directly
        if (groupData.visibility === 'public') {
            return await joinGroup(groupId);
        }

        // For private groups, create a request
        const requestData = {
            group_id: groupId,
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous User'
        };

        const { data, error } = await supabase
            .from('group_requests')
            .insert([requestData])
            .select();

        if (error) throw error;
        return { success: true, data: data[0], message: 'Request to join group sent successfully' };
    } catch (error) {
        console.error('Error requesting to join group:', error);
        return { success: false, error: error.message };
    }
}

// Function to get pending requests for a group (for admins)
async function getGroupRequests(groupId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Check if user is admin of the group
        const userRoleResult = await getUserRoleInGroup(groupId);
        if (!userRoleResult.success || userRoleResult.data !== 'admin') {
            return { success: false, error: 'Only group admins can view requests' };
        }

        const { data, error } = await supabase
            .from('group_requests')
            .select('*')
            .eq('group_id', groupId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching group requests:', error);
        return { success: false, error: error.message };
    }
}

// Function to process a group request (approve/reject)
async function processGroupRequest(requestId, action) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Get the request details
        const { data: requestData, error: requestError } = await supabase
            .from('group_requests')
            .select('group_id, user_id')
            .eq('id', requestId)
            .maybeSingle();

        if (requestError) throw requestError;
        if (!requestData) {
            return { success: false, error: 'Request not found' };
        }

        // Check if user is admin of the group
        const userRoleResult = await getUserRoleInGroup(requestData.group_id);
        if (!userRoleResult.success || userRoleResult.data !== 'admin') {
            return { success: false, error: 'Only group admins can process requests' };
        }

        // Update the request status
        const updateData = {
            status: action,
            processed_at: new Date(),
            processed_by: user.id
        };

        const { data, error } = await supabase
            .from('group_requests')
            .update(updateData)
            .eq('id', requestId)
            .select();

        if (error) throw error;

        // If approved, add user to group
        if (action === 'approved') {
            const memberData = {
                user_id: requestData.user_id,
                group_id: requestData.group_id,
                role: 'member',
                user_email: data[0].user_email,
                user_name: data[0].user_name
            };

            const { error: memberError } = await supabase
                .from('group_members')
                .insert([memberData]);

            if (memberError) {
                console.error('Error adding user to group:', memberError);
                // This is not a critical error, so we continue
            }

            // Update member count
            await updateGroupMemberCount(requestData.group_id);
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error processing group request:', error);
        return { success: false, error: error.message };
    }
}

// Function to transfer group ownership
async function transferGroupOwnership(groupId, newOwnerId) {
    const supabase = initStudyGroupsSupabase();
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Check if current user is the group creator/admin
        const { data: groupData, error: groupError } = await supabase
            .from('study_groups')
            .select('created_by, current_admin')
            .eq('id', groupId)
            .maybeSingle();

        if (groupError) throw groupError;

        const isCurrentAdmin = groupData.created_by === user.id || groupData.current_admin === user.id;
        if (!isCurrentAdmin) {
            return { success: false, error: 'Only the group owner or current admin can transfer ownership' };
        }

        // Update the current_admin field
        const { data, error } = await supabase
            .from('study_groups')
            .update({ current_admin: newOwnerId })
            .eq('id', groupId)
            .select();

        if (error) throw error;
        
        // Make the new owner an admin in group_members if they're not already
        const { error: memberError } = await supabase
            .from('group_members')
            .upsert({ 
                user_id: newOwnerId, 
                group_id: groupId, 
                role: 'admin' 
            }, { onConflict: 'user_id,group_id' });

        if (memberError) {
            console.warn('Failed to make new owner an admin in group_members:', memberError);
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error transferring group ownership:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAllGroups,
        createGroup,
        updateGroupStatus,
        deleteGroup,
        getUserGroups,
        joinGroup,
        leaveGroup,
        getGroupMembers,
        isGroupMember,
        getUserRoleInGroup,
        promoteMember,
        demoteAdmin,
        removeMember,
        // New functions
        sendGroupMessage,
        getGroupMessages,
        updateGroupSettings,
        requestToJoinGroup,
        getGroupRequests,
        processGroupRequest,
        transferGroupOwnership
    };
}