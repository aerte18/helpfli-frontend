import { useEffect, useRef, useState } from "react";

export function useInView(options){
	const ref = useRef(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		if (!ref.current) return;
		const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), options || { threshold: 0.4 });
		obs.observe(ref.current);
		return () => obs.disconnect();
	}, [ref.current]);

	return [ref, inView];
}





























