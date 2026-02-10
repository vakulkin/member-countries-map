<?php
/**
 * Plugin Name: Member Countries Map
 * Description: Displays an SVG map of European countries highlighting those with "member" post type entries, filtered by ACF "country" field.
 * Version: 1.0.0
 * Author: Developer
 * Text Domain: member-countries-map
 */

if (! defined('ABSPATH')) {
    exit;
}

define('MCM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MCM_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Enqueue plugin assets.
 */
function mcm_enqueue_assets()
{
    wp_register_style(
        'member-countries-map',
        MCM_PLUGIN_URL . 'assets/css/member-countries-map.css',
        array(),
        '1.0.0'
    );

    wp_register_script(
        'member-countries-map',
        MCM_PLUGIN_URL . 'assets/js/member-countries-map.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'mcm_enqueue_assets');

/**
 * Get all members grouped by country code.
 *
 * @return array Associative array keyed by country code, values are arrays of member data.
 */
function mcm_get_members_by_country()
{
    $members_by_country = array();

    $query = new WP_Query(array(
        'post_type'      => 'member',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
    ));

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $country_code = strtoupper(trim(get_field('country')));

            if (empty($country_code)) {
                continue;
            }

            if (! isset($members_by_country[ $country_code ])) {
                $members_by_country[ $country_code ] = array();
            }

            $members_by_country[ $country_code ][] = array(
                'title' => get_the_title(),
                'url'   => get_permalink(),
            );
        }
        wp_reset_postdata();
    }

    return $members_by_country;
}

/**
 * Country code to full name mapping.
 */
function mcm_get_country_names()
{
    return array(
        'AD' => 'Andorra',
        'AL' => 'Albania',
        'AM' => 'Armenia',
        'AT' => 'Austria',
        'AZ' => 'Azerbaijan',
        'BA' => 'Bosnia and Herzegovina',
        'BE' => 'Belgium',
        'BG' => 'Bulgaria',
        'BY' => 'Belarus',
        'CH' => 'Switzerland',
        'CY' => 'Cyprus',
        'CZ' => 'Czech Republic',
        'DE' => 'Germany',
        'DK' => 'Denmark',
        'DZ' => 'Algeria',
        'EE' => 'Estonia',
        'ES' => 'Spain',
        'FI' => 'Finland',
        'FR' => 'France',
        'GB' => 'United Kingdom',
        'GE' => 'Georgia',
        'GL' => 'Greenland',
        'GR' => 'Greece',
        'HR' => 'Croatia',
        'HU' => 'Hungary',
        'IE' => 'Ireland',
        'IL' => 'Israel',
        'IQ' => 'Iraq',
        'IR' => 'Iran',
        'IS' => 'Iceland',
        'IT' => 'Italy',
        'JO' => 'Jordan',
        'KS' => 'Kosovo',
        'KZ' => 'Kazakhstan',
        'LB' => 'Lebanon',
        'LI' => 'Liechtenstein',
        'LT' => 'Lithuania',
        'LU' => 'Luxembourg',
        'LV' => 'Latvia',
        'MA' => 'Morocco',
        'MC' => 'Monaco',
        'MD' => 'Moldova',
        'ME' => 'Montenegro',
        'MK' => 'North Macedonia',
        'MT' => 'Malta',
        'NL' => 'Netherlands',
        'NO' => 'Norway',
        'PL' => 'Poland',
        'PT' => 'Portugal',
        'RO' => 'Romania',
        'RS' => 'Serbia',
        'RU' => 'Russia',
        'SA' => 'Saudi Arabia',
        'SE' => 'Sweden',
        'SI' => 'Slovenia',
        'SK' => 'Slovakia',
        'SM' => 'San Marino',
        'SY' => 'Syria',
        'TM' => 'Turkmenistan',
        'TN' => 'Tunisia',
        'TR' => 'Turkey',
        'UA' => 'Ukraine',
    );
}

/**
 * Shortcode: [member_countries_map]
 */
function mcm_render_shortcode($atts)
{
    $atts = shortcode_atts(array(
        'title' => 'Member Countries',
    ), $atts, 'member_countries_map');

    wp_enqueue_style('member-countries-map');
    wp_enqueue_script('member-countries-map');

    $members_by_country = mcm_get_members_by_country();
    $country_names      = mcm_get_country_names();
    $active_countries   = array_keys($members_by_country);

    // Build data for JS
    $map_data = array(
        'activeCountries'  => $active_countries,
        'membersByCountry' => $members_by_country,
        'countryNames'     => $country_names,
    );

    ob_start();
    ?>
<div class="mcm-member-countries">

	<input type="hidden" id="mcm-member-countries-data"
		data-map='<?php echo esc_attr(wp_json_encode($map_data)); ?>'>

	<div class="mcm-members-map" id="mcm-members-map">
		<?php include MCM_PLUGIN_DIR . 'member-countries-map.svg'; ?>
		<div class="jqvmap-zoomin">+</div>
		<div class="jqvmap-zoomout">−</div>
	</div>

	<a id="mcm-btn-show-all" href="#" class="mcm-btn-show-all mcm-hidden">
		<span class="notranslate">«</span> Show all countries
	</a>

	<div class="mcm-member-country-list">
		<?php foreach ($country_names as $code => $name) : ?>
		<?php
                if (! isset($members_by_country[ $code ])) {
                    continue;
                }
		    $members = $members_by_country[ $code ];
		    ?>
		<div class="mcm-member-country"
			data-code="<?php echo esc_attr($code); ?>">
			<div class="mcm-member-country__title">
				<?php echo esc_html($name); ?>
			</div>
			<ul class="mcm-member-country__members">
				<?php foreach ($members as $member) : ?>
				<li>
					<span class="notranslate">›</span>
					<a
						href="<?php echo esc_url($member['url']); ?>">
						<?php echo esc_html($member['title']); ?>
					</a>
				</li>
				<?php endforeach; ?>
			</ul>
		</div>
		<?php endforeach; ?>
	</div>

</div>
<?php
    return ob_get_clean();
}
add_shortcode('member_countries_map', 'mcm_render_shortcode');
?>