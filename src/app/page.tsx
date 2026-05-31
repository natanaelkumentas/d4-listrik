import HeroSection from "@/components/home/HeroSection";
import SambutanSection from "@/components/home/SambutanSection";
import StatsSection from "@/components/home/StatsSection";
import ChartsSection from "@/components/home/ChartsSection";
import NewsSection from "@/components/home/NewsSection";
import LazySection from "@/components/universal/LazySection";

export default function Home() {
  return (
    <>
      <HeroSection />
      
      <LazySection placeholderHeight="450px">
        <SambutanSection />
      </LazySection>

      <LazySection placeholderHeight="400px">
        <StatsSection />
      </LazySection>

      <LazySection placeholderHeight="650px">
        <ChartsSection />
      </LazySection>

      <LazySection placeholderHeight="650px">
        <NewsSection />
      </LazySection>
    </>
  );
}

