import WelcomeFooter from "../components/welcome/WelcomeFooter.jsx";
import HeroSection from "../components/welcome/HeroSection.jsx";
import WelcomeNavbar from "../components/welcome/WelcomeNavbar.jsx";
import FloatingTechBackground from "../components/FloatingTechBackground.jsx";

export default function Welcome() {
  return (
    <div className="welcome-page" style={{ position: "relative", overflow: "hidden" }}>
      <FloatingTechBackground density="high" />
      <WelcomeNavbar />
      <HeroSection />
      <WelcomeFooter />
    </div>
  );
}

