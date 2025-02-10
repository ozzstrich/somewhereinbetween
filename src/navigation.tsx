export const scrollToPubCard = (pubId: string) => {
    const element = document.getElementById(`pub-card-${pubId}`);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        element.classList.add('highlighted');
        setTimeout(() => element.classList.remove('highlighted'), 2000);
    }
};
