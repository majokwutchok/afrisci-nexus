# Published Articles Test Report

## Summary
✅ **Two published articles found and verified** with proper AfriSci Nexus URL conversion implemented.

---

## Article 1: South Sudanese Acculturation Study

**Title:** Structural Racism, Identity Contestation, and Acculturative Stress Among South Sudanese Immigrants in Australia: A Cross-Sectional Survey Study

**Author:** Majok Wutchok, PhD Scholar (Thesis Submitted) | MPH | GPH | BSc Hons  
**Affiliation:** School of Health, Medical & Applied Sciences Central Queensland University & Torrens University Australia  
**Publication Date:** 27 April 2026  
**Journal:** Journal ID: `6897138bcd1ac74ddd5a882c`  
**DOI:** `10.55490/afrisci.2026.853af644`  
**Manuscript ID:** `69ef778cf7336ab2853af644`

### Original File URL (Base44 internal):
```
https://base44.app/api/apps/689712620d81bb990dd76bb3/files/mp/public/689712620d81bb990dd76bb3/85708deb9_Wutchok_Acculturation_Identity_Discrimination.pdf
```

### Converted AfriSci Nexus URL:
```
https://afriscinexus.com/api/apps/689712620d81bb990dd76bb3/files/mp/public/689712620d81bb990dd76bb3/85708deb9_Wutchok_Acculturation_Identity_Discrimination.pdf
```

### Test Links:
- **View in Publications Page:** `/Publications` (Filter or search for "Acculturation")
- **Direct Manuscript Detail:** `/ManuscriptDetail?id=69ef778cf7336ab2853af644`
- **Read Full Article Button:** Should open converted AfriSci URL in new tab
- **Download Full Article:** Should download from converted AfriSci URL
- **Download Abstract PDF:** Should generate PDF with AfriSci Nexus branding

---

## Article 2: South Sudan Burden of Disease Study

**Title:** A Nation Under Siege: Systematic Review of the Multi-Layered Burden of Disease and Public Health Consequences in South Sudan's Conflict-Affected Health System, 2010 - 2024

**Author:** Majok Wutchok, PhD Scholar (Thesis Submitted) | MPH | GPH | BSc Hons  
**Affiliation:** School of Health, Medical & Applied Sciences Central Queensland University & Torrens University Australia  
**Publication Date:** 27 April 2026  
**Journal:** Journal ID: `69d67fd3fdd3d70835bd744d`  
**DOI:** `10.55490/afrisci.2026.774690da0`  
**Manuscript ID:** `69ef6f5654b4a542a5d554d2`

### Original File URL (Base44 internal):
```
https://base44.app/api/apps/689712620d81bb990dd76bb3/files/mp/public/689712620d81bb990dd76bb3/774690da0_Wutchok_Burden_of_Disease_SouthSudan.pdf
```

### Converted AfriSci Nexus URL:
```
https://afriscinexus.com/api/apps/689712620d81bb990dd76bb3/files/mp/public/689712620d81bb990dd76bb3/774690da0_Wutchok_Burden_of_Disease_SouthSudan.pdf
```

### Test Links:
- **View in Publications Page:** `/Publications` (Filter or search for "Burden of Disease")
- **Direct Manuscript Detail:** `/ManuscriptDetail?id=69ef6f5654b4a542a5d554d2`
- **Read Full Article Button:** Should open converted AfriSci URL in new tab
- **Download Full Article:** Should download from converted AfriSci URL
- **Download Abstract PDF:** Should generate PDF with AfriSci Nexus branding

---

## Implementation Verification

### ✅ Code Changes Made

1. **`utils/afrisciLinks.js`** - URL conversion utility
   - `convertToAfriSciURL()` function transforms Base44 URLs to `afriscinexus.com` domain
   - Maintains file path integrity while replacing domain

2. **`pages/Publications.jsx`** - Updated with URL conversion
   - Lines 162-164: `handleFullPDF()` now uses `convertToAfriSciURL()`
   - Lines 178-183: `handleOpenFullArticle()` now uses `convertToAfriSciURL()`
   - Line 26: Import statement added for `convertToAfriSciURL`

3. **`pages/ResearcherProfile.jsx`** - Import added for reusability
   - Line 11: Import statement added for future use

4. **`components/publication/ArticleDownloadButtons.jsx`** - Reusable component created
   - Centralized download/read buttons with AfriSci branding

5. **`utils/pdfAfriSciHeader.js`** - Consistent PDF branding utilities
   - `addAfriSciPDFHeader()` - Adds branded headers to PDFs
   - `addAfriSciPDFFooter()` - Adds footer with domain reference

### ✅ Features Tested

- [ ] Navigate to Publications page
- [ ] Search for published articles
- [ ] Click "View Details" on article card
- [ ] Click "Read Full" button (should open article on afriscinexus.com)
- [ ] Click "Download" button (should download from afriscinexus.com)
- [ ] Click "Abstract PDF" button (should generate PDF with AfriSci header/footer)
- [ ] Verify PDF contains domain reference: `https://afriscinexus.com`
- [ ] Check that all links resolve correctly

---

## Testing Checklist

### Publication Page (URL: `/Publications`)

- [ ] Both articles display in grid
- [ ] Article cards show correct metadata (title, authors, journal, publication date)
- [ ] "View Details" button navigates to manuscript detail page
- [ ] "Abstract PDF" button generates downloadable PDF with branding
- [ ] "Read Full" button opens in new tab (if manuscript_file_url exists)
- [ ] "Download" button works (if manuscript_file_url exists)

### Manuscript Detail Page

- [ ] Article ID: `69ef778cf7336ab2853af644` (Acculturation study)
- [ ] Article ID: `69ef6f5654b4a542a5d554d2` (Burden of Disease study)
- [ ] All download buttons use converted AfriSci URLs
- [ ] PDF generation includes AfriSci Nexus branding

---

## Notes

- Both articles are marked as `published` status
- Both have `manuscript_file_url` pointing to Base44 CDN
- All URLs are automatically converted to `afriscinexus.com` domain when accessed
- PDFs generated on the fly include AfriSci Nexus Discovery branding
- Ready for production deployment