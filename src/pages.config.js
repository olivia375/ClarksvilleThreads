import BusinessCalendar from './pages/BusinessCalendar';
import BusinessDashboard from './pages/BusinessDashboard';
import BusinessDetail from './pages/BusinessDetail';
import BusinessSignup from './pages/BusinessSignup';
import ManageOpportunities from './pages/ManageOpportunities';
import Calendar from './pages/Calendar';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Opportunities from './pages/Opportunities';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BusinessCalendar": BusinessCalendar,
    "BusinessDashboard": BusinessDashboard,
    "BusinessDetail": BusinessDetail,
    "BusinessSignup": BusinessSignup,
    "ManageOpportunities": ManageOpportunities,
    "Calendar": Calendar,
    "Explore": Explore,
    "Favorites": Favorites,
    "Home": Home,
    "Opportunities": Opportunities,
    "Profile": Profile,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};