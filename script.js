// ---- Forkify App JS ----

const API_URL = 'https://forkify-api.herokuapp.com/api/v2/recipes';

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('resultsList');
const recipeDetails = document.getElementById('recipeDetails');
const addRecipeBtn = document.getElementById('addRecipeBtn');
const addRecipeModal = document.getElementById('addRecipeModal');
const closeAddRecipe = document.getElementById('closeAddRecipe');
const addRecipeForm = document.getElementById('addRecipeForm');
const bookmarksModal = document.getElementById('bookmarksModal');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const closeBookmarks = document.getElementById('closeBookmarks');
const bookmarksList = document.getElementById('bookmarksList');

let recipes = [];
let selectedId = null;

// --- LocalStorage helpers ---
function getLocalRecipes() {
  return JSON.parse(localStorage.getItem('userRecipes') || '[]');
}
function setLocalRecipes(arr) {
  localStorage.setItem('userRecipes', JSON.stringify(arr));
}
function getBookmarks() {
  return JSON.parse(localStorage.getItem('bookmarks') || '[]');
}
function setBookmarks(arr) {
  localStorage.setItem('bookmarks', JSON.stringify(arr));
}

// --- Fetch Recipes ---
async function fetchRecipes(query) {
  try {
    recipeDetails.innerHTML = '<div class="welcome">🔄 Searching...</div>';
    const res = await fetch(`${API_URL}?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    recipes = data.data.recipes || [];
    renderRecipeList();
    if (recipes.length === 0 && getLocalRecipes().length === 0) {
      recipeDetails.innerHTML = '<div class="welcome">No recipes found. Try another keyword.</div>';
    } else {
      recipeDetails.innerHTML = `<div class="welcome">Select a recipe to view details.</div>`;
    }
  } catch (err) {
    recipeDetails.innerHTML = '<div class="welcome">Error fetching recipes.</div>';
    resultsList.innerHTML = '';
  }
}

// --- Render List (includes user recipes) ---
function renderRecipeList() {
  const userRecipes = getLocalRecipes();
  let allRecipes = [...userRecipes, ...recipes];
  resultsList.innerHTML = allRecipes.map((recipe, idx) => `
    <div class="recipe-item${selectedId === recipe.id ? ' selected' : ''}" data-id="${recipe.id}">
      <img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-img"/>
      <div class="recipe-info">
        <span class="recipe-title">${recipe.title.length > 27 ? recipe.title.slice(0,27)+'…' : recipe.title}</span>
        <span class="recipe-publisher">${recipe.publisher}</span>
      </div>
    </div>
  `).join('');
}

// --- Fetch Single Recipe (API or local) ---
async function fetchRecipeDetails(id) {
  // Try local recipes first
  const userRecipe = getLocalRecipes().find(r => r.id === id);
  if (userRecipe) {
    showRecipeDetails(userRecipe);
    selectedId = id;
    renderRecipeList();
    return;
  }
  try {
    recipeDetails.innerHTML = '<div class="welcome">🔄 Loading recipe...</div>';
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();
    showRecipeDetails(data.data.recipe);
    selectedId = id;
    renderRecipeList();
  } catch (err) {
    recipeDetails.innerHTML = '<div class="welcome">Failed to load recipe details.</div>';
  }
}

// --- Show Recipe Details (with bookmark icon) ---
function showRecipeDetails(recipe) {
  const isBookmarked = getBookmarks().some(r => r.id === recipe.id);
  recipeDetails.innerHTML = `
    <img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-main-img"/>
    <div class="recipe-title-banner">${recipe.title}
      <span id="bookmarkToggle" title="Bookmark" style="float:right;cursor:pointer;font-size:1.4em;color:${isBookmarked ? '#ff914d' : '#ccc'};">
        <i class="fa${isBookmarked ? 's' : 'r'} fa-bookmark"></i>
      </span>
    </div>
    <div class="recipe-meta">
      <span><i class="fa fa-clock"></i> ${recipe.cooking_time || 0} minutes</span>
      <span><i class="fa fa-users"></i> ${recipe.servings || 1} servings</span>
    </div>
    <div class="recipe-ingredients">
      <h3>Recipe Ingredients</h3>
      <div class="ingredients-list">
        <ul>
          ${recipe.ingredients.slice(0, Math.ceil(recipe.ingredients.length/2)).map(ing => `<li>${ing.description ? ing.description : ''}${ing.quantity ? ' - ' + ing.quantity + ' ' + (ing.unit || '') : ''}</li>`).join('')}
        </ul>
        <ul>
          ${recipe.ingredients.slice(Math.ceil(recipe.ingredients.length/2)).map(ing => `<li>${ing.description ? ing.description : ''}${ing.quantity ? ' - ' + ing.quantity + ' ' + (ing.unit || '') : ''}</li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="how-to-cook">
      This recipe was carefully designed and tested by <b>${recipe.publisher}</b>. Please check out directions at their website:<br/>
      <a href="${recipe.source_url || '#'}" target="_blank" style="color: #ff914d; font-weight:600;">Go to full recipe</a>
    </div>
  `;
  // Bookmark toggle
  document.getElementById('bookmarkToggle').onclick = () => {
    let bookmarks = getBookmarks();
    if (bookmarks.some(r => r.id === recipe.id)) {
      bookmarks = bookmarks.filter(r => r.id !== recipe.id);
    } else {
      bookmarks.unshift(recipe);
    }
    setBookmarks(bookmarks);
    showRecipeDetails(recipe); // refresh icon
  };
}

// --- Event Listeners ---
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) fetchRecipes(query);
});

resultsList.addEventListener('click', (e) => {
  const parent = e.target.closest('.recipe-item');
  if (!parent) return;
  const id = parent.getAttribute('data-id');
  if (id) fetchRecipeDetails(id);
});

// Optional: Highlight selected
resultsList.addEventListener('mouseover', (e) => {
  const parent = e.target.closest('.recipe-item');
  if (!parent) return;
  Array.from(resultsList.children).forEach(child => child.classList.remove('selected'));
  parent.classList.add('selected');
});

// --- Add Recipe Modal ---
addRecipeBtn.onclick = () => { addRecipeModal.classList.remove('hidden'); addRecipeModal.style.display = 'block'; };
closeAddRecipe.onclick = () => { addRecipeModal.classList.add('hidden'); addRecipeModal.style.display = 'none'; };
window.onclick = (e) => {
  if (e.target === addRecipeModal) { addRecipeModal.classList.add('hidden'); addRecipeModal.style.display = 'none'; }
  if (e.target === bookmarksModal) { bookmarksModal.classList.add('hidden'); bookmarksModal.style.display = 'none'; }
};
addRecipeForm.onsubmit = (e) => {
  e.preventDefault();
  const title = document.getElementById('recipeTitle').value.trim();
  const publisher = document.getElementById('recipePublisher').value.trim();
  const image_url = document.getElementById('recipeImage').value.trim();
  const ingredientsArr = document.getElementById('recipeIngredients').value.split(',').map(s => ({description: s.trim()})).filter(i => i.description);
  if (!title || !publisher || !image_url || !ingredientsArr.length) return;
  // Create fake id with timestamp
  const id = "user-" + Date.now();
  const newRecipe = { id, title, publisher, image_url, ingredients: ingredientsArr, cooking_time: 0, servings: 1, source_url: '#' };
  const recipes = getLocalRecipes();
  recipes.unshift(newRecipe);
  setLocalRecipes(recipes);
  addRecipeModal.classList.add('hidden');
  addRecipeModal.style.display = 'none';
  addRecipeForm.reset();
  fetchRecipes(searchInput.value || ''); // refresh sidebar
};

// --- Bookmarks Modal ---
bookmarkBtn.onclick = () => { bookmarksModal.classList.remove('hidden'); bookmarksModal.style.display = 'block'; renderBookmarks(); };
closeBookmarks.onclick = () => { bookmarksModal.classList.add('hidden'); bookmarksModal.style.display = 'none'; };

function renderBookmarks() {
  const bookmarks = getBookmarks();
  if (!bookmarks.length) {
    bookmarksList.innerHTML = "<p>No bookmarks yet!</p>";
    return;
  }
  bookmarksList.innerHTML = bookmarks.map(recipe => `
    <div class="recipe-item" data-id="${recipe.id}">
      <img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-img" />
      <div class="recipe-info">
        <span class="recipe-title">${recipe.title.length > 27 ? recipe.title.slice(0,27)+'…' : recipe.title}</span>
        <span class="recipe-publisher">${recipe.publisher}</span>
      </div>
    </div>
  `).join('');
  // Enable click-to-view for bookmarked recipes
  bookmarksList.querySelectorAll('.recipe-item').forEach(item => {
    item.onclick = () => fetchRecipeDetails(item.getAttribute('data-id'));
  });
}
