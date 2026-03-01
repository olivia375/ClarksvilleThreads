import BusinessDashboard from './pages/BusinessDashboard';
import BusinessDetail from './pages/BusinessDetail';
import BusinessSignup from './pages/BusinessSignup';
import Calendar from './pages/Calendar';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Opportunities from './pages/Opportunities';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BusinessDashboard": BusinessDashboard,
    "BusinessDetail": BusinessDetail,
    "BusinessSignup": BusinessSignup,
    "Calendar": Calendar,
    "Explore": Explore,
    "Favorites": Favorites,
    "Home": Home,
    "Opportunities": Opportunities,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};