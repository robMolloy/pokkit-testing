import { H1 } from "@/components/custom/H1";
import { MainFixedLayout, Scroll } from "@/components/templates/LayoutTemplate";

export default function Page() {
  return (
    <MainFixedLayout>
      <H1>Scrolling page with fixed header</H1>
      <Scroll>
        {[...Array(100)].map((_, j) => (
          <div key={j}>this is how we scroooooolll</div>
        ))}
      </Scroll>
      <H1>Scrolling page with fixed footer</H1>
    </MainFixedLayout>
  );
}
