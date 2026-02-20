import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Heart, Users, Building2, Award, CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({ businesses: 0, opportunities: 0 });

  React.useEffect(() => {
    Promise.all([
    entities.Business.list(),
    entities.VolunteerOpportunity.filter({ status: "open" })]
    ).then(([businesses, opportunities]) => {
      setStats({
        businesses: businesses.length,
        opportunities: opportunities.length
      });
    });
  }, []);

  const features = [
  {
    icon: Building2,
    title: "Discover Local Businesses",
    description: "Find small businesses and nonprofits in your community that need support",
    color: "pink"
  },
  {
    icon: Heart,
    title: "Make a Difference",
    description: "Share your skills and time to help businesses thrive and grow",
    color: "rose"
  },
  {
    icon: Users,
    title: "Build Connections",
    description: "Connect with like-minded volunteers and passionate business owners",
    color: "purple"
  },
  {
    icon: Award,
    title: "Earn Recognition",
    description: "Track your volunteer hours and receive special offers from businesses you help",
    color: "fuchsia"
  }];


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#fffcf5] py-20 relative overflow-hidden sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full mb-6">
              <Star className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-medium text-blue-900">Join Our Community</span>
            </div>
            
            <h1 className="bg-transparent text-gray-900 mt-1 mr-1 mb-6 px-1 text-4xl font-bold tracking-tight leading-tight sm:text-5xl lg:text-6xl">Volunteer to
Support Local Businesses




            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join a community of volunteers helping small businesses and nonprofits thrive. 
              Share your time, build connections, and make a real impact in your neighborhood.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-red-400 text-white px-8 py-3 text-base font-medium rounded-lg hover:bg-blue-800 shadow-md hover:shadow-lg transition-all">
                <Link to={createPageUrl("Profile")}>
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-pink-200 px-8 py-3 text-base font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50">
                <Link to={createPageUrl("Explore")}>
                  Explore Opportunities
                </Link>
              </Button>
            </div>

            <div className="mt-8 text-center">
              <Link to={createPageUrl("BusinessSignup")} className="text-blue-900 font-medium hover:underline">
                Are you a business? Register here →
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stats.businesses}+</p>
                <p className="text-sm text-gray-600 mt-1">Businesses</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stats.opportunities}+</p>
                <p className="text-sm text-gray-600 mt-1">Opportunities</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600 mt-1">Free</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Making a difference in your community has never been easier
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) =>
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}>

                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>

    </div>);

}