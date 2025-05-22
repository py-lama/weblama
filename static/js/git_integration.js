// WebLama - Git Integration

// Git History Modal
const gitHistoryModal = document.getElementById('git-history-modal');
const gitHistoryBtn = document.getElementById('git-history-button');
const gitHistoryClose = gitHistoryModal ? gitHistoryModal.querySelector('.close') : null;
const gitCommitsContainer = document.getElementById('git-commits');
const gitVersionComparisonContainer = document.getElementById('git-version-comparison');

// Publish Modal
const publishModal = document.getElementById('publish-modal');
const publishBtn = document.getElementById('git-publish-button');
const publishClose = publishModal ? publishModal.querySelector('.close') : null;
const providerSelect = document.getElementById('provider');
const publishRepoBtn = document.getElementById('publish-repo-btn');
const publishResultContainer = document.getElementById('publish-result');

// Current state
let currentCommitHash = null;
let originalContent = null;

// Show Git History Modal
if (gitHistoryBtn) {
    gitHistoryBtn.addEventListener('click', async () => {
        // Get the current filename
        const filename = document.getElementById('filename').value.trim() || 'document.md';
        
        try {
            // Show the modal
            gitHistoryModal.classList.remove('hidden');
            gitHistoryModal.classList.add('show');
            
            // Load the commit history
            await loadCommitHistory(filename);
        } catch (error) {
            console.error('Error loading Git history:', error);
            gitCommitsContainer.innerHTML = `<div class="error">Error loading Git history: ${error.message}</div>`;
        }
    });
}

// Close Git History Modal
if (gitHistoryClose) {
    gitHistoryClose.addEventListener('click', () => {
        gitHistoryModal.classList.remove('show');
        gitHistoryModal.classList.add('hidden');
    });
}

// Show Publish Modal
if (publishBtn) {
    publishBtn.addEventListener('click', () => {
        // Show the modal
        publishModal.classList.remove('hidden');
        publishModal.classList.add('show');
        
        // Reset the form
        publishResultContainer.innerHTML = '';
        publishResultContainer.className = 'publish-result';
    });
}

// Close Publish Modal
if (publishClose) {
    publishClose.addEventListener('click', () => {
    publishModal.classList.remove('show');
    publishModal.classList.add('hidden');
});

// Handle provider change
providerSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    
    // Show/hide provider-specific fields
    document.querySelectorAll('.github-gitlab').forEach(el => {
        el.style.display = (provider === 'github' || provider === 'gitlab') ? 'block' : 'none';
    });
    
    document.querySelectorAll('.gitlab-only').forEach(el => {
        el.style.display = provider === 'gitlab' ? 'block' : 'none';
    });
    
    document.querySelectorAll('.bitbucket-only').forEach(el => {
        el.style.display = provider === 'bitbucket' ? 'block' : 'none';
    });
});

// Load commit history
async function loadCommitHistory(filename) {
    try {
        // Show loading state
        gitCommitsContainer.innerHTML = '<div class="loading">Loading commit history...</div>';
        
        // Get the commit history from the server
        const response = await fetch(`/api/git/history?filename=${encodeURIComponent(filename)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Unknown error');
        }
        
        // Store the original content (current editor content)
        originalContent = editor.getValue();
        
        // Display the commit history
        if (data.history.length === 0) {
            gitCommitsContainer.innerHTML = '<div class="no-history">No commit history found.</div>';
            gitVersionComparisonContainer.innerHTML = '';
            return;
        }
        
        let historyHtml = '';
        
        data.history.forEach((commit, index) => {
            const date = new Date(commit.date).toLocaleString();
            historyHtml += `
                <div class="commit-item" data-commit-hash="${commit.commit_hash}">
                    <div class="commit-message">${escapeHtml(commit.message)}</div>
                    <div class="commit-author">${escapeHtml(commit.author)}</div>
                    <div class="commit-date">${date}</div>
                    <div class="commit-hash">${commit.commit_hash.substring(0, 8)}</div>
                </div>
            `;
        });
        
        gitCommitsContainer.innerHTML = historyHtml;
        
        // Add click event listeners to commit items
        document.querySelectorAll('.commit-item').forEach(item => {
            item.addEventListener('click', async () => {
                // Remove active class from all commit items
                document.querySelectorAll('.commit-item').forEach(i => i.classList.remove('active'));
                
                // Add active class to the clicked commit item
                item.classList.add('active');
                
                // Get the commit hash
                const commitHash = item.dataset.commitHash;
                currentCommitHash = commitHash;
                
                // Load the file content at this commit
                await loadFileContentAtCommit(filename, commitHash);
            });
        });
        
        // Load the first commit by default
        if (data.history.length > 0) {
            const firstCommitItem = document.querySelector('.commit-item');
            firstCommitItem.classList.add('active');
            currentCommitHash = data.history[0].commit_hash;
            await loadFileContentAtCommit(filename, currentCommitHash);
        }
    } catch (error) {
        console.error('Error loading commit history:', error);
        gitCommitsContainer.innerHTML = `<div class="error">Error loading commit history: ${error.message}</div>`;
    }
}

// Load file content at a specific commit
async function loadFileContentAtCommit(filename, commitHash) {
    try {
        // Show loading state
        gitVersionComparisonContainer.innerHTML = '<div class="loading">Loading file content...</div>';
        
        // Get the file content from the server
        const response = await fetch(`/api/git/content?filename=${encodeURIComponent(filename)}&commit_hash=${encodeURIComponent(commitHash)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Unknown error');
        }
        
        // Display the file content comparison
        const comparisonHtml = `
            <div class="version-comparison">
                <div class="version-original">
                    <div class="version-header">Current Version</div>
                    <div class="version-content">${escapeHtml(originalContent)}</div>
                </div>
                <div class="version-selected">
                    <div class="version-header">Selected Version (${commitHash.substring(0, 8)})</div>
                    <div class="version-content">${escapeHtml(data.content)}</div>
                </div>
            </div>
            <div class="version-actions">
                <button class="restore-btn" onclick="restoreVersion('${commitHash}')">Restore This Version</button>
            </div>
        `;
        
        gitVersionComparisonContainer.innerHTML = comparisonHtml;
        
        // Render Mermaid diagrams in the comparison view
        try {
            // Find Mermaid diagrams in the content
            const mermaidPattern = /```mermaid\n([\s\S]*?)\n```/g;
            let match;
            
            // Create containers for Mermaid diagrams
            let currentIndex = 0;
            while ((match = mermaidPattern.exec(data.content)) !== null) {
                const mermaidCode = match[1];
                const mermaidContainer = document.createElement('div');
                mermaidContainer.className = 'mermaid';
                mermaidContainer.id = `mermaid-${commitHash.substring(0, 8)}-${currentIndex}`;
                mermaidContainer.textContent = mermaidCode;
                
                // Replace the code in the version content with the container
                const versionContent = gitVersionComparisonContainer.querySelector('.version-selected .version-content');
                const codeBlock = '```mermaid\n' + mermaidCode + '\n```';
                versionContent.innerHTML = versionContent.innerHTML.replace(
                    escapeHtml(codeBlock),
                    `<div id="mermaid-${commitHash.substring(0, 8)}-${currentIndex}" class="mermaid">${escapeHtml(mermaidCode)}</div>`
                );
                
                currentIndex++;
            }
            
            // Initialize Mermaid
            mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        } catch (error) {
            console.error('Error rendering Mermaid diagrams:', error);
        }
    } catch (error) {
        console.error('Error loading file content:', error);
        gitVersionComparisonContainer.innerHTML = `<div class="error">Error loading file content: ${error.message}</div>`;
    }
}

// Restore a specific version
function restoreVersion(commitHash) {
    if (!commitHash) return;
    
    // Get the content from the selected version
    const selectedContent = gitVersionComparisonContainer.querySelector('.version-selected .version-content').textContent;
    
    // Update the editor with the selected content
    editor.setValue(selectedContent);
    
    // Close the modal
    gitHistoryModal.classList.remove('show');
    gitHistoryModal.classList.add('hidden');
    
    // Update the preview
    updatePreview();
}

// Publish repository
publishRepoBtn.addEventListener('click', async () => {
    // Get form values
    const provider = providerSelect.value;
    const repoName = document.getElementById('repo-name').value.trim();
    const username = document.getElementById('username').value.trim();
    const token = document.getElementById('token').value.trim();
    const gitlabUrl = document.getElementById('gitlab-url').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Validate form
    if (!repoName) {
        alert('Repository name is required');
        return;
    }
    
    if (provider === 'github' || provider === 'gitlab') {
        if (!token) {
            alert('Access token is required');
            return;
        }
    }
    
    if (provider === 'bitbucket') {
        if (!username || !password) {
            alert('Username and app password are required for Bitbucket');
            return;
        }
    }
    
    // Show loading state
    publishRepoBtn.disabled = true;
    publishRepoBtn.textContent = 'Publishing...';
    publishResultContainer.innerHTML = '<div class="loading">Publishing repository...</div>';
    
    try {
        // Prepare the request data
        const requestData = {
            provider,
            repo_name: repoName,
            username
        };
        
        if (provider === 'github' || provider === 'gitlab') {
            requestData.token = token;
        }
        
        if (provider === 'gitlab') {
            requestData.gitlab_url = gitlabUrl;
        }
        
        if (provider === 'bitbucket') {
            requestData.password = password;
        }
        
        // Send the request to the server
        const response = await fetch('/api/git/publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message
            publishResultContainer.innerHTML = `<div class="success">${data.message}</div>`;
            publishResultContainer.className = 'publish-result publish-success';
        } else {
            // Show error message
            publishResultContainer.innerHTML = `<div class="error">${data.message}</div>`;
            publishResultContainer.className = 'publish-result publish-error';
        }
    } catch (error) {
        console.error('Error publishing repository:', error);
        publishResultContainer.innerHTML = `<div class="error">Error publishing repository: ${error.message}</div>`;
        publishResultContainer.className = 'publish-result publish-error';
    } finally {
        // Reset button state
        publishRepoBtn.disabled = false;
        publishRepoBtn.textContent = 'Publish';
    }
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === gitHistoryModal) {
        gitHistoryModal.classList.remove('show');
        gitHistoryModal.classList.add('hidden');
    }
    
    if (event.target === publishModal) {
        publishModal.classList.remove('show');
        publishModal.classList.add('hidden');
    }
});
}
