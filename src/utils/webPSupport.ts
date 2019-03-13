export function webPSupport() {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			img.remove();
			resolve();
		};
		img.onerror = () => {
			img.remove();
			reject();
		};

		img.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
	});
}
