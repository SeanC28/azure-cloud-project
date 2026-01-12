#!/bin/bash

# --- 1. USE THE SAME STATIC NAME HERE ---
FUNC_APP_NAME="sean-counter-static-2025"
BACKEND_URL="https://sean-counter-static-2025.azurewebsites.net/api/UpdateCount"

RG_NAME="MyStaticSiteRG"
STORAGE_NAME="mysite18845" # Ensure this matches your storage

echo "Updating Frontend to point to: $BACKEND_URL"

# 2. Create HTML
cat <<EOF > index.html
<!DOCTYPE html>
<html>
<head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <title>Sean's App</title>
</head>
<body class="bg-dark text-white">

    <div class="container mt-5 text-center">
        <h1 class="display-4 mb-4">Sean's Dashboard</h1>
        
        <div class="card mx-auto text-dark" style="width: 24rem;">
            <img src="Shin.jpg" class="card-img-top" alt="Shin Chan">
            <div class="card-body">
                <h5 class="card-title">Shin Chan</h5>
                <p class="card-text" id="statusText">Status: Ready to send love.</p>
                <p class="fw-bold text-primary" id="countText">Total Beams Fired: --</p>
                
                <div class="d-grid gap-2">
                    <button id="actionBtn" class="btn btn-primary">Fire Love Beam</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const btn = document.getElementById('actionBtn');
        const statusText = document.getElementById('statusText');
        const countText = document.getElementById('countText');
        const apiUrl = "$BACKEND_URL"; 

        btn.addEventListener('click', async () => {
            statusText.innerText = "Status: Powering up beam...";
            btn.disabled = true; 

            try {
                const response = await fetch(apiUrl); 
                
                if (response.ok) {
                    const data = await response.json();
                    statusText.innerText = "Status: LOVE RECEIVED! (Confirmed)";
                    statusText.style.color = "green";
                    statusText.style.fontWeight = "bold";
                    countText.innerText = "Total Beams Fired: " + data.count;
                } else {
                    statusText.innerText = "Status: Server Error (" + response.status + ")";
                }
            } catch (error) {
                console.error(error);
                statusText.innerText = "Status: Comms Link Offline.";
            } finally {
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
EOF

# 3. Upload
az storage blob upload \
  --account-name $STORAGE_NAME \
  --container-name '$web' \
  --name index.html \
  --file index.html \
  --content-type "text/html" \
  --overwrite

echo "Frontend Updated!"